// src/routes/booking.ts
import { FastifyInstance } from "fastify";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

export default async function bookingRoutes(fastify: FastifyInstance) {
  const db = getFirestore();

  // -------------------------------------------------------
  // GET /therapists  --> return all users with role = therapist
  // -------------------------------------------------------
  fastify.get("/therapists", async (_, reply) => {
    try {
      const snaps = await db
        .collection("users")
        .where("role", "==", "therapist")
        .get();

      const therapists = snaps.docs.map(d => ({
        id: d.id, // this is the UID of the therapist
        ...d.data(),
      }));

      return reply.send({ therapists });
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // -------------------------------------------------------
  // POST /booking  --> create booking
  // -------------------------------------------------------
  fastify.post("/", async (req, reply) => {
    try {
      const body = req.body as {
        userId: string;
        therapistId: string; // MUST be UID
        therapistName: string;
        date: string;
        time: string;
        type: string;
      };

      const { userId, therapistId, therapistName, date, time, type } = body;

      if (!userId || !therapistId || !therapistName || !date || !time || !type) {
        return reply.code(400).send({ error: "Missing required fields" });
      }

      const bookingId = `${therapistId}_${date}_${time}`.replace(/[:\s]/g, "_");
      const bookingRef = db.collection("bookings").doc(bookingId);

      // Use transaction to prevent double-booking
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(bookingRef);

        if (snap.exists && snap.data()?.status !== "cancelled") {
          throw new Error("This time slot is already booked.");
        }

        tx.set(bookingRef, {
          id: bookingId,
          userId,
          therapistId,       // MUST be UID
          therapistName,     // display name
          date,
          time,
          type,
          status: "pending",
          createdAt: Timestamp.now(),
          blockchainTxHash: null,
        });
      });

      // Create chat document
      await db.collection("chats").doc(bookingId).set({
        id: bookingId,
        participants: [userId, therapistId],
        createdAt: Timestamp.now(),
      });

      return reply.send({ bookingId });
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // -------------------------------------------------------
  // GET /booking?userId=xxx  --> get bookings for a user
  // -------------------------------------------------------
  fastify.get("/", async (req, reply) => {
    try {
      const userId = (req.query as any).userId;
      if (!userId) return reply.code(400).send({ error: "Missing userId" });

      const snaps = await db
        .collection("bookings")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      return reply.send({ bookings: snaps.docs.map(d => d.data()) });
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // -------------------------------------------------------
  // POST /booking/cancel  --> cancel a booking
  // -------------------------------------------------------
  fastify.post("/cancel", async (req, reply) => {
    try {
      const { bookingId, userId } = req.body as { bookingId: string; userId: string };
      if (!bookingId || !userId) return reply.code(400).send({ error: "Missing fields" });

      const ref = db.collection("bookings").doc(bookingId);
      const snap = await ref.get();

      if (!snap.exists) throw new Error("Booking not found");
      if (snap.data()?.userId !== userId) throw new Error("Not authorized");

      await ref.update({ status: "cancelled" });

      return reply.send({ success: true });
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // -------------------------------------------------------
  // GET /booking/therapist?therapistId=xxx  --> get bookings for a therapist
  // -------------------------------------------------------
  fastify.get("/therapist", async (req, reply) => {
    try {
      const therapistId = (req.query as any).therapistId;
      if (!therapistId) return reply.code(400).send({ error: "Missing therapistId" });

      const snaps = await db
        .collection("bookings")
        .where("therapistId", "==", therapistId)
        .orderBy("createdAt", "desc")
        .get();

      return reply.send({ bookings: snaps.docs.map(d => d.data()) });
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  // -------------------------------------------------------
  // POST /booking/resolve  --> mark booking as completed
  // -------------------------------------------------------
  fastify.post("/resolve", async (req, reply) => {
    try {
      const { bookingId, therapistId } = req.body as { bookingId: string; therapistId: string };
      if (!bookingId || !therapistId) return reply.code(400).send({ error: "Missing fields" });

      const ref = db.collection("bookings").doc(bookingId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error("Booking not found");

      // Optional: verify therapistId matches logged-in therapist
      if (snap.data()?.therapistId !== therapistId) throw new Error("Not authorized");

      await ref.update({ status: "completed" });

      return reply.send({ success: true });
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });
}
