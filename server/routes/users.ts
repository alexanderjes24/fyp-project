import { FastifyInstance } from "fastify";

export default async function usersRoutes(fastify: FastifyInstance) {
  // ✅ Register new user
  fastify.post("/users/register", async (request, reply) => {
    try {
      const { uid, email, name, token } = request.body as {
        uid: string;
        email: string;
        name: string;
        token: string;
      };

      // Verify Firebase token to ensure authenticity
      const decoded = await fastify.firebase.auth().verifyIdToken(token);

      if (decoded.uid !== uid) {
        return reply.status(401).send({ success: false, message: "Invalid user token" });
      }

      // Save user info in Firestore
      await fastify.db.collection("users").doc(uid).set({
        email,
        name,
        createdAt: new Date().toISOString(),
      });

      return { success: true, message: "User registered successfully" };
    } catch (error: any) {
      console.error("❌ Registration failed:", error);
      reply.status(500).send({ success: false, message: error.message });
    }
  });
}
