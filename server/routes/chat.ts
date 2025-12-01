// src/routes/chat.ts
import { FastifyInstance } from "fastify";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export default async function chatRoutes(fastify: FastifyInstance) {
  const db = getFirestore();

  // ------------------- GET chat messages -------------------
  fastify.get("/:bookingId", async (req, reply) => {
    try {
      const { bookingId } = req.params as { bookingId: string };
      const { userId, therapistId } = req.query as { userId?: string; therapistId?: string };

      if (!userId && !therapistId) return reply.code(400).send({ error: "Missing user or therapist ID" });

      const chatRef = db.collection("chats").doc(bookingId);
      const chatSnap = await chatRef.get();

      if (!chatSnap.exists) return reply.code(404).send({ error: "Chat not found" });

      const participants: string[] = chatSnap.data()?.participants || [];
      if (!(userId && participants.includes(userId)) && !(therapistId && participants.includes(therapistId))) {
        return reply.code(403).send({ error: "Not authorized" });
      }

      const messagesSnap = await chatRef.collection("messages").orderBy("timestamp", "asc").get();
      const messages = messagesSnap.docs.map(d => ({
        id: d.id,
        text: d.data().text,
        sender: d.data().sender,
        timestamp: d.data().timestamp?.toDate() || new Date(),
        blockchainTxHash: d.data().blockchainTxHash || null,
      }));

      return reply.send({ messages });
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // ------------------- Send message -------------------
  fastify.post("/send", async (req, reply) => {
    try {
      const { chatId, sender, text, userId, therapistId } = req.body as {
        chatId: string;
        sender: "user" | "therapist";
        text: string;
        userId?: string;
        therapistId?: string;
      };

      if (!chatId || !sender || !text) return reply.code(400).send({ error: "Missing fields" });

      const chatRef = db.collection("chats").doc(chatId);
      const chatSnap = await chatRef.get();

      if (!chatSnap.exists) return reply.code(404).send({ error: "Chat not found" });

      const participants: string[] = chatSnap.data()?.participants || [];
      if (!(userId && participants.includes(userId)) && !(therapistId && participants.includes(therapistId))) {
        return reply.code(403).send({ error: "Not authorized" });
      }

      await chatRef.collection("messages").add({
        text,
        sender,
        timestamp: Timestamp.now(),
      });

      return reply.send({ success: true });
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });
}
