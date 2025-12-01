// server/routes/admin.ts
import { FastifyInstance } from "fastify";

export default async function adminRoutes(fastify: FastifyInstance) {
  const db = fastify.firebase.firestore();
  console.log("Registering /admin routes...");
  // Get all users (no auth enforced here; consider adding auth in production)
  fastify.get("/users", async (request, reply) => {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }));
    return users;
  });

  // Promote a user to therapist
  fastify.post("/promote", async (request, reply) => {
    const { uid } = request.body as { uid: string };
    if (!uid) return reply.status(400).send({ error: "Missing uid" });

    try {
      await db.collection("users").doc(uid).update({ role: "therapist" });
      return { success: true, message: `User ${uid} promoted to therapist` };
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  // Revoke therapist
  fastify.post("/revoke", async (request, reply) => {
    const { uid } = request.body as { uid: string };
    if (!uid) return reply.status(400).send({ error: "Missing uid" });

    try {
      await db.collection("users").doc(uid).update({ role: "user" });
      return { success: true, message: `User ${uid} role revoked` };
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  // Stats: Total users, therapists, banned
  fastify.get("/stats", async (req, reply) => {
    console.log("Route /admin/stats called");
    try {
      const db = fastify.firebase.firestore(); // inside try
      const snapshot = await db.collection("users").get();
      const all = snapshot.docs.map(doc => doc.data() as any);

      const totalUsers = all.length;
      const therapists = all.filter(u => u.role === "therapist").length;
      const normalUsers = all.filter(u => u.role === "user").length;
      const banned = all.filter(u => u.banned === true).length;

      return { totalUsers, therapists, normalUsers, banned };
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      return reply.status(500).send({ error: "Failed to fetch stats" });
    }
  });

    fastify.post("/ban", async (req, reply) => {
    const { uid } = req.body as any;
    await db.collection("users").doc(uid).update({ banned: true });
    return { success: true };
  });

  fastify.post("/unban", async (req, reply) => {
    const { uid } = req.body as any;
    await db.collection("users").doc(uid).update({ banned: false });
    return { success: true };
  });

}
