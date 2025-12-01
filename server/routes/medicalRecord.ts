import { FastifyInstance } from "fastify";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export default async function medicalRecordRoutes(fastify: FastifyInstance) {
  const db = getFirestore();

  fastify.post("/", async (req, reply) => {
    try {
      const { userId, therapistId, title, description, blockchainHash } = req.body as any;
      if (!userId || !therapistId || !title || !description)
        return reply.code(400).send({ error: "Missing required fields" });

      const id = `${therapistId}_${userId}_${Date.now()}`;
      await db.collection("medicalRecords").doc(id).set({
        id,
        userId,
        therapistId,
        title,
        description,
        blockchainHash: blockchainHash || null,
        submittedToBlockchain: false,
        createdAt: Timestamp.now(),
      });

      return reply.send({ id });
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });
}
