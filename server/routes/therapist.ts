// server/routes/therapist.ts

import { FastifyInstance } from "fastify";
import admin from "firebase-admin";
import crypto from "crypto";
// IMPORTANT: You need to update getVerifiedCredential if you renamed your contract
import { getVerifiedCredential, storeCredentialHash } from "../blockchain/credential";
import { storeMedicalRecordHash } from "../blockchain/record"; // NEW IMPORT

interface SubmitCredsBody {
  uid: string;
  name: string;
  university: string;
  license: string;
  dateOfLicense: string; // ISO string
}

interface SubmitMedicalRecordBody {
  bookingId: string;
  therapistId: string; // Used for verification
  diagnosis: string;
  prescription: string;
  notes: string;
}

type ApprovalStatus = "pending" | "approved" | "rejected";

export default async function therapistRoutes(fastify: FastifyInstance) {
  const db = admin.firestore();

  // -----------------------------
  // Middleware: Verify Firebase Token for protected routes
  // -----------------------------
  fastify.addHook("preHandler", async (request, reply) => {
    // UPDATED: Include new medical-record route and the /approve-cred route
    if (
      request.url.startsWith("/therapist/check-credentials") ||
      request.url.startsWith("/therapist/submit-credentials") ||
      request.url.startsWith("/therapist/approve-cred") || // Using the dedicated route name
      request.url.startsWith("/therapist/medical-record/create")
    ) {
      const token = request.headers.authorization?.split(" ")[1];
      if (!token) return reply.code(401).send({ error: "Unauthorized: Missing token" });

      try {
        const decoded = await admin.auth().verifyIdToken(token);
        (request as any).user = decoded;
      } catch (err) {
        return reply.code(401).send({ error: "Unauthorized: Invalid token" });
      }
    }
  });

  // -----------------------------
  // Check if therapist has credentials (protected)
  // -----------------------------
  fastify.get("/check-credentials", async (request, reply) => {
    const uid = (request.query as any).uid || (request as any).user.uid;
    const docSnap = await db.collection("therapistCredentials").doc(uid).get();
    reply.send({ hasCreds: docSnap.exists, credentials: docSnap.data() || null });
  });

  // -----------------------------
  // Submit therapist credentials (protected)
  // -----------------------------
  fastify.post<{ Body: SubmitCredsBody }>("/submit-credentials", async (request, reply) => {
    const { uid, name, university, license, dateOfLicense } = request.body;
    const currentUser = (request as any).user;

    if (currentUser.uid !== uid && currentUser.role !== "admin") {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const credentials = {
      name,
      university,
      license,
      dateOfLicense,
      approval: "pending" as ApprovalStatus,
      createdAt: new Date(),
      hash: null, // placeholder for blockchain hash later
      txHash: null,
    };

    await db.collection("therapistCredentials").doc(uid).set(credentials);
    reply.send({ success: true, credentials });
  });

  // -----------------------------
  // Admin approves credential & stores hash on blockchain
  // -----------------------------
  fastify.post("/approve-cred", async (request, reply) => {
    const { uid } = request.body as { uid: string };
    const currentUser = (request as any).user;

    if (currentUser.role !== "admin") {
      return reply.code(403).send({ error: "Forbidden: Admin required" });
    }
    if (!uid) return reply.status(400).send({ error: "Missing uid" });

    try {
      const docRef = db.collection("therapistCredentials").doc(uid);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return reply.status(404).send({ error: "Credentials not found" });

      const data = docSnap.data() as any;
      if (data.approval === "approved") return reply.send({ success: true, hash: data.hash, txHash: data.txHash });

      // 1. Generate SHA256 hash
      const dataToHash = {
        uid,
        name: data.name,
        university: data.university,
        license: data.license,
        dateOfLicense: data.dateOfLicense,
      };
      
      const hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(dataToHash))
        .digest("hex");
      
      const formattedHash = `0x${hash}`;
      let txHash: string;

      // 2. Store hash on blockchain using the helper
      try {
        const receipt = await storeCredentialHash(uid, formattedHash);
        txHash = receipt.hash;
      } catch (err: any) {
        console.error("Blockchain storage failed:", err.message);
        return reply.status(500).send({ error: "Blockchain Transaction Failed: " + err.message });
      }

      // 3. Update Firestore (Only runs if blockchain succeeded)
      await docRef.update({
        approval: "approved",
        hash: formattedHash,
        txHash,
      });

      return { success: true, hash: formattedHash, txHash };
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });
  
  // ------------------------------------
  // NEW: Create and Hash Medical Record (Protected)
  // ------------------------------------
  fastify.post<{ Body: SubmitMedicalRecordBody }>(
    "/medical-record/create",
    async (request, reply) => {
      const { bookingId, therapistId, diagnosis, prescription, notes } = request.body;
      const currentUser = (request as any).user;
      
      // 1. Authorization Check: Ensure the logged-in user is the one submitting the record
      if (currentUser.uid !== therapistId) {
        return reply.code(403).send({ error: "Forbidden: Not authorized to submit this record." });
      }

      // 2. Booking Verification: Ensure the booking is assigned to this therapist
      const bookingDoc = await db.collection("bookings").doc(bookingId).get();
      if (!bookingDoc.exists || bookingDoc.data()?.therapistId !== therapistId) {
        return reply.code(403).send({ error: "Forbidden: Booking not found or not assigned to you." });
      }

      try {
        // 3. Generate SHA-256 Hash
        const dataToHash = {
          bookingId,
          therapistId,
          diagnosis,
          prescription,
          notes,
          // NOTE: Timestamp is excluded from the hash so we can verify the core data later 
          // without worrying about minor time differences, but we store it in Firebase.
        };

        const hash = crypto
          .createHash("sha256")
          .update(JSON.stringify(dataToHash))
          .digest("hex");

        const formattedHash = `0x${hash}`;
        let txHash: string;

        // 4. Store Hash on Blockchain using the helper
        try {
          // Calls the function in record.ts
          const receipt = await storeMedicalRecordHash(bookingId, therapistId, formattedHash);
          txHash = receipt.hash;
        } catch (err: any) {
          console.error("Blockchain storage for medical record failed:", err.message);
          return reply.status(500).send({ error: "Blockchain Transaction Failed: " + err.message });
        }

        // 5. Update Firestore (The Official Record)
        const recordData = {
          bookingId,
          therapistId,
          diagnosis,
          prescription,
          notes,
          timestamp: new Date().toISOString(),
          blockchainHash: formattedHash,
          txHash,
        };

        await db.collection("medicalRecords").doc(bookingId).set(recordData);

        // 6. Respond to frontend
        return {
          success: true,
          message: "Record secured and submitted.",
          hash: formattedHash,
          txHash,
        };

      } catch (err: any) {
        console.error("Error in medical record creation:", err);
        reply.status(500).send({ error: err.message || "Internal server error." });
      }
    }
  );

  // -----------------------------
  // Public: Get all therapists with credentials
  // -----------------------------
  fastify.get("/all-therapists", async (request, reply) => {
    const { uid } = request.query as { uid?: string };

    if (uid) {
      const docSnap = await db.collection("therapistCredentials").doc(uid).get();
      if (!docSnap.exists) return reply.code(404).send({ error: "Therapist not found" });
      return reply.send({ credentials: docSnap.data() });
    }

    const snapshot = await db.collection("therapistCredentials").get();
    const therapists = snapshot.docs.map((doc) => ({ uid: doc.id, ...(doc.data() as any) }));
    reply.send({ therapists });
  });

  // -----------------------------
  // Public: Verify Credential on Chain
  // -----------------------------
  fastify.get("/verify-cred/:uid", async (req, reply) => {
    const { uid } = req.params as { uid: string };

    try {
      // 1. Fetch canonical data directly from the blockchain
      const blockchainData = await getVerifiedCredential(uid);

      if (!blockchainData) {
        return reply.status(200).send({ verified: false, message: "No record found on chain." });
      }

      // 2. Data found! Return the verified hash and timestamp.
      return reply.send({
        verified: true,
        hash: blockchainData.hash,
        timestamp: blockchainData.timestamp
      });

    } catch (err: any) {
      reply.status(500).send({ verified: false, error: "Blockchain connection error." });
    }
  });
}