// server/routes/admin.ts
import { FastifyInstance } from "fastify";

export default async function adminRoutes(fastify: FastifyInstance) {
  const db = fastify.firebase.firestore();

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
}
