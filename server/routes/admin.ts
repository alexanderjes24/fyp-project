import { FastifyInstance } from "fastify";

export default async function adminRoutes(fastify: FastifyInstance) {
  const db = fastify.firebase.firestore();

  console.log("Registering /admin routes...");

  // ---------------------------
  // Users
  // ---------------------------

  // Get all users
  fastify.get("/users", async (req, reply) => {
    try {
      const snapshot = await db.collection("users").get();
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      return users;
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  // Promote to therapist
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

  // Revoke therapist
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

  // Ban user
  fastify.post("/ban", async (req, reply) => {
    const { uid } = req.body as { uid: string };
    await db.collection("users").doc(uid).update({ banned: true });
    return { success: true };
  });

  // Unban user
  fastify.post("/unban", async (req, reply) => {
    const { uid } = req.body as { uid: string };
    await db.collection("users").doc(uid).update({ banned: false });
    return { success: true };
  });

  // Stats
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

  // Get all therapist credentials
  fastify.get("/therapist-creds", async (req, reply) => {
    try {
      const snapshot = await db.collection("therapistCredentials").get();
      const creds = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
      return creds;
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  // Approve credentials
  fastify.post("/approve-cred", async (req, reply) => {
    const { uid } = req.body as { uid: string };
    if (!uid) return reply.status(400).send({ error: "Missing uid" });

    try {
      await db.collection("therapistCredentials").doc(uid).update({ approval: "approved" });
      return { success: true };
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
