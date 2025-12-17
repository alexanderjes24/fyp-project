// server/routes/admin.ts
import { FastifyInstance } from "fastify";
import crypto from "crypto";
import { storeCredentialHash } from "../blockchain/credential";

export default async function adminRoutes(fastify: FastifyInstance) {
  const db = fastify.firebase.firestore();

  console.log("Registering /admin routes...");

  // ---------------------------
  // Users
  // ---------------------------
  fastify.get("/users", async (req, reply) => {
    try {
      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      return users;
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.post("/promote", async (req, reply) => {
    const { uid } = req.body as { uid: string };
    if (!uid) return reply.status(400).send({ error: "Missing uid" });
    try {
      await db.collection("users").doc(uid).update({ role: "therapist" });
      return { success: true };
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  fastify.post("/revoke", async (req, reply) => {
    const { uid } = req.body as { uid: string };
    if (!uid) return reply.status(400).send({ error: "Missing uid" });
    try {
      await db.collection("users").doc(uid).update({ role: "user" });
      return { success: true };
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  

  fastify.get("/stats", async (req, reply) => {
    try {
      const snapshot = await db.collection("users").get();
      const all = snapshot.docs.map((doc) => doc.data() as any);

      const totalUsers = all.length;
      const therapists = all.filter((u) => u.role === "therapist").length;
      const normalUsers = all.filter((u) => u.role === "user").length;
      const banned = all.filter((u) => u.banned === true).length;

      return { totalUsers, therapists, normalUsers, banned };
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  // ---------------------------
  // Therapist Credentials
  // ---------------------------
  fastify.get("/therapist-creds", async (req, reply) => {
    try {
      const snapshot = await db.collection("therapistCredentials").get();
      const creds = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      return creds;
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  // ---------------------------
  // Approve credentials, generate hash, store on blockchain
  // ---------------------------
  fastify.post("/approve-cred", async (req, reply) => {
    const { uid } = req.body as { uid: string };
    if (!uid) return reply.status(400).send({ error: "Missing uid" });

    try {
      const docRef = db.collection("therapistCredentials").doc(uid);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return reply.status(404).send({ error: "Credentials not found" });

      const data = docSnap.data() as any;

      // ---- Generate SHA256 hash ----
      const hash = crypto
        .createHash("sha256")
        .update(
          JSON.stringify({
            uid,
            name: data.name,
            university: data.university,
            license: data.license,
            dateOfLicense: data.dateOfLicense,
          })
        )
        .digest("hex");

      // ---- Store hash on blockchain ----
      let txHash: string | null = null;
      
      try {
        // This will now throw an error if it fails, instead of returning null
        const receipt = await storeCredentialHash(uid, hash);
        txHash = receipt.hash; // ethers v6 receipt uses .hash, NOT .transactionHash
      } catch (err: any) {
        console.error("Blockchain storage failed:", err.message);
        // DECISION: Do you want to stop here? 
        // Or continue saving to Firebase but mark it as 'blockchain_failed'?
        
        // Option A: Stop and tell frontend (Recommended for debugging)
        return reply.status(500).send({ error: "Blockchain Transaction Failed: " + err.message });
      }

      // ---- Update Firestore ----
      // Only runs if blockchain succeeded
      await docRef.update({
        approval: "approved",
        hash,
        txHash, // This is now guaranteed to be a string
      });

      return { success: true, hash, txHash };
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  // Reject credentials
  fastify.post("/reject-cred", async (req, reply) => {
    const { uid } = req.body as { uid: string };
    if (!uid) return reply.status(400).send({ error: "Missing uid" });

    try {
      await db.collection("therapistCredentials").doc(uid).update({ approval: "rejected" });
      return { success: true };
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });
}
