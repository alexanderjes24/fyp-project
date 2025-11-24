import { FastifyInstance } from "fastify";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

interface QuizAnswer {
  questionId: number;
  answerValue: string | number | string[];
}

export default async function quizRoutes(fastify: FastifyInstance) {
  fastify.post("/quiz", async (request, reply) => {
    try {
      const { userId, answers } = request.body as {
        userId: string;
        answers: QuizAnswer[];
      };

      // Basic validation
      if (!userId || !Array.isArray(answers) || answers.length === 0) {
        return reply.status(400).send({ error: "Missing userId or answers" });
      }

      const db = getFirestore();

      // Create new quiz document
      await db.collection("quizResponses").add({
        userId,
        answers,
        createdAt: Timestamp.now(),
      });

      return reply.status(200).send({ success: true });
    } catch (error) {
      console.error("Quiz save error:", error);
      return reply.status(500).send({ error: "Server error" });
    }
  });
}
