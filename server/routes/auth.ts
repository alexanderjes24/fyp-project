import { FastifyInstance } from "fastify";

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/verify-token", async (request, reply) => {
    const { token } = request.body as { token: string };
    try {
      // ✅ Notice: your plugin exposes "firebase", not "firebaseAdmin"
      const decoded = await fastify.firebase.auth().verifyIdToken(token);

      return { success: true, uid: decoded.uid, email: decoded.email };
    } catch (err) {
      reply.status(401).send({ error: "Invalid token" });
    }
  });
}
