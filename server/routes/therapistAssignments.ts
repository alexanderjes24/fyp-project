import { FastifyInstance } from "fastify";

export default async function therapistAssignmentsRoutes(fastify: FastifyInstance) {

  // Middleware: verify token and check role
  fastify.addHook("preHandler", async (request, reply) => {
    const token = request.headers.authorization?.replace("Bearer ", "");
    if (!token) return reply.status(401).send({ error: "Missing token" });

    try {
      const decoded = await fastify.firebase.auth().verifyIdToken(token);
      const db = fastify.firebase.firestore();
      const userDoc = await db.collection("users").doc(decoded.uid).get();

      if (!userDoc.exists) return reply.status(401).send({ error: "User not found" });
      const role = userDoc.data()?.role;

      if (role !== "therapist") return reply.status(403).send({ error: "Forbidden" });

      // Attach uid for later use
      (request as any).uid = decoded.uid;
    } catch (err) {
      return reply.status(401).send({ error: "Invalid token" });
    }
  });

  // POST /therapist/assignment → create assignment
  fastify.post("/assignment", async (request, reply) => {
    const { userId, data } = request.body as { userId: string; data: any };
    const db = fastify.firebase.firestore();

    const id = crypto.randomUUID();
    await db.collection("assignments").doc(userId).collection("items").doc(id).set({
      ...data,
      createdAt: new Date(),
      complete: false,
    });

    return { success: true, id };
  });

  // DELETE /therapist/assignment → delete assignment
  fastify.delete("/assignment", async (request, reply) => {
    const { userId, assignmentId } = request.body as { userId: string; assignmentId: string };
    const db = fastify.firebase.firestore();

    await db.collection("assignments").doc(userId).collection("items").doc(assignmentId).delete();

    return { success: true };
  });
}
