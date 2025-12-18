import { FastifyInstance } from "fastify";

export default async function authRoutes(fastify: FastifyInstance) {

  // --- Verify token route ---
  fastify.post("/verify-token", async (request, reply) => {
    const { token } = request.body as { token: string };
    try {
      const decoded = await fastify.firebase.auth().verifyIdToken(token);
      return { success: true, uid: decoded.uid, email: decoded.email };
    } catch (err) {
      reply.status(401).send({ error: "Invalid token" });
    }
  });

  

  fastify.post("/get-user", async (request, reply) => {
    const { token } = request.body as { token?: string };
    if (!token) {
      return reply.status(400).send({ error: "Missing token" });
    }

    try {
      const decoded = await fastify.firebase.auth().verifyIdToken(token);
      const db = fastify.firebase.firestore();
      const doc = await db.collection("users").doc(decoded.uid).get();

      if (!doc.exists) {
        return reply.status(404).send({ error: "User not found" });
      }

      return {
        uid: decoded.uid,
        email: decoded.email,
        role: doc.data()?.role || "user",
      };
    } catch (err: any) {
      return reply.status(401).send({ error: err.message || "Invalid token" });
    }
  });
}





