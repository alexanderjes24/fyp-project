// bookingService.ts
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  Timestamp,
  deleteDoc,
  updateDoc,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { Booking } from "../types/data";
import type { AvailableSlot } from "../types/data";

const db = getFirestore();

function makeBookingDocId(therapistId: string, date: string, time: string) {
  // deterministic id to avoid race conditions
  // normalized: replace spaces/colons with underscores
  const key = `${therapistId}_${date}_${time}`.replace(/[:\s]/g, "_");
  return encodeURIComponent(key);
}

/**
 * Create a booking using a transaction that enforces uniqueness per therapist+date+time.
 * Returns booking doc id.
 */
export async function createBooking({
  userId,
  therapistId,
  date,
  time,
  type,
}: {
  userId: string;
  therapistId: string;
  date: string;
  time: string;
  type: "Video" | "Phone" | "Live Chat";
}) {
  const bookingId = makeBookingDocId(therapistId, date, time);
  const bookingRef = doc(db, "bookings", bookingId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(bookingRef as any);
    if (snap.exists()) {
      const existing = snap.data() as Booking;
      if (existing.status !== "cancelled") {
        throw new Error("Time slot already booked for this therapist.");
      }
      // If existing.status === 'cancelled', we allow overwrite (or you can create new id)
    }

    tx.set(bookingRef as any, {
      id: bookingId,
      userId,
      therapistId,
      date,
      time,
      type,
      status: "pending",
      createdAt: Timestamp.now(),
    });
  });

  return bookingId;
}

/** Cancel booking (user-initiated) */
export async function cancelBooking(bookingId: string, userId: string) {
  const bookingRef = doc(db, "bookings", bookingId);
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) throw new Error("Booking not found");
  const data = snap.data() as Booking;
  if (data.userId !== userId) throw new Error("Not authorized to cancel this booking");

  await updateDoc(bookingRef, { status: "cancelled" });
  return true;
}

/** Therapist resolves/completes booking */
export async function updateBookingStatus(bookingId: string, therapistId: string, status: Booking["status"]) {
  const bookingRef = doc(db, "bookings", bookingId);
  const snap = await getDoc(bookingRef);
  if (!snap.exists()) throw new Error("Booking not found");
  const data = snap.data() as Booking;
  if (data.therapistId !== therapistId) throw new Error("Not authorized");

  await updateDoc(bookingRef, { status });
  return true;
}

/** Get bookings for a user */
export async function getUserBookings(userId: string) {
  const q = query(collection(db, "bookings"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => d.data() as Booking);
}

/** Get bookings for a therapist (pending/confirmed) */
export async function getTherapistBookings(therapistId: string) {
  const q = query(collection(db, "bookings"), where("therapistId", "==", therapistId), orderBy("createdAt", "desc"));
  const snaps = await getDocs(q);
  return snaps.docs.map((d) => d.data() as Booking);
}

/** Optional: create a chat doc for a booking and return chatId */
export async function createChatForBooking(bookingId: string, userId: string, therapistId: string) {
  // chat doc id same as bookingId for convenience (or create random)
  const chatRef = doc(db, "chats", bookingId);
  await setDoc(chatRef, {
    id: bookingId,
    participants: [userId, therapistId],
    createdAt: Timestamp.now(),
  });
  // create subcollection messages empty - messages added later
  return bookingId;
}
