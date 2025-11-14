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

      // 1️⃣ Verify Firebase token
      const decoded = await fastify.firebase.auth().verifyIdToken(token);
      if (decoded.uid !== uid) {
        return reply.status(401).send({
          success: false,
          message: "Invalid user token",
        });
      }

      // 2️⃣ Check Firestore for duplicate email ONLY for registration
      const existingUserSnapshot = await fastify.db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (!existingUserSnapshot.empty) {
        return reply.status(400).send({
          success: false,
          message: "Email is already registered",
        });
      }

      // 3️⃣ Save new user info in Firestore
      await fastify.db.collection("users").doc(uid).set({
        email,
        name,
        createdAt: new Date().toISOString(),
      });

      return { success: true, message: "User registered successfully" };
    } catch (error: any) {
      console.error("❌ Registration failed:", error);

      // Handle Firebase Auth duplicate email error
      if (error.code === "auth/email-already-exists") {
        return reply.status(400).send({
          success: false,
          message: "Email is already registered",
        });
      }

      reply.status(500).send({ success: false, message: error.message });
    }
  });

  // ✅ Optional: Login endpoint (just verify Firebase token, no email check)
  fastify.post("/users/login", async (request, reply) => {
    try {
      const { token } = request.body as { token: string };

      // Verify Firebase token
      const decoded = await fastify.firebase.auth().verifyIdToken(token);

      // Fetch user profile from Firestore
      const userDoc = await fastify.db.collection("users").doc(decoded.uid).get();
      if (!userDoc.exists) {
        return reply.status(404).send({
          success: false,
          message: "User profile not found. Complete registration first.",
        });
      }

      return { success: true, user: { uid: decoded.uid, ...userDoc.data() } };
    } catch (error: any) {
      console.error("❌ Login failed:", error);
      reply.status(500).send({ success: false, message: error.message });
    }
  });

  // ✅ Optional: Endpoint to check if email exists (frontend validation)
  fastify.get("/users/by-email", async (request, reply) => {
    const { email } = request.query as { email: string };
    const snapshot = await fastify.db
      .collection("users")
      .where("email", "==", email)
      .get();

    const users = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
    return { success: true, users };
  });
}
