// server/routes/therapist.ts
import { FastifyInstance } from "fastify";
import admin from "firebase-admin";
import crypto from "crypto";

interface SubmitCredsBody {
  uid: string;
  name: string;
  university: string;
  license: string;
  dateOfLicense: string; // ISO string
}

type ApprovalStatus = "pending" | "approved" | "rejected";

export default async function therapistRoutes(fastify: FastifyInstance) {
  const db = admin.firestore();

  // -----------------------------
  // Middleware: Verify Firebase Token for protected routes
  // -----------------------------
  fastify.addHook("preHandler", async (request, reply) => {
    // Only for routes that start with /check-credentials or /submit-credentials or /update-approval
    if (
      request.url.startsWith("/therapist/check-credentials") ||
    request.url.startsWith("/therapist/submit-credentials") ||
    request.url.startsWith("/therapist/update-approval")
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
      hash: null // placeholder for blockchain hash later
    };

    await db.collection("therapistCredentials").doc(uid).set(credentials);
    reply.send({ success: true, credentials });
  });

  // -----------------------------
  // Admin updates approval & optionally add blockchain hash
  // -----------------------------
  fastify.post("/update-approval", async (request, reply) => {
    const { uid, approval } = request.body as { uid: string; approval: ApprovalStatus };
    const currentUser = (request as any).user;

    if (currentUser.role !== "admin") {
      return reply.code(403).send({ error: "Forbidden" });
    }

    const docRef = db.collection("therapistCredentials").doc(uid);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return reply.code(404).send({ error: "Credentials not found" });
    }

    const data = docSnap.data() || {};
    // Generate hash if approved and no hash yet
    let hash = data.hash || null;
    if (approval === "approved" && !hash) {
      hash = crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
    }

    await docRef.update({ approval, hash });
    reply.send({ success: true, approval, hash });
  });

  // -----------------------------
  // Public: Get all therapists with credentials
  // -----------------------------
  fastify.get("/all-therapists", async (request, reply) => {
    const snapshot = await db.collection("therapistCredentials").get();
    const therapists = snapshot.docs.map((doc) => ({ uid: doc.id, ...(doc.data() as any) }));
    reply.send({ therapists });
  });
}
