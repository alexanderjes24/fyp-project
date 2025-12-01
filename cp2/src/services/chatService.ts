import { db } from "../firebaseClient"; // Your firebaseClient.ts should export Firestore
import type { Message } from "../types/data";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

// Helper to format timestamp as "HH:MM AM/PM"
function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, "0");
  return `${h}:${m} ${ampm}`;
}

// Send a message
export async function sendMessage(
  conversationId: string,
  msg: { text: string; sender: "user" | "therapist"; blockchainTxHash?: string }
) {
  const colRef = collection(db, "chats", conversationId, "messages");
  await addDoc(colRef, {
    ...msg,
    timestamp: serverTimestamp(),
  });
}

// Subscribe to messages (real-time)
export function subscribeToMessages(
  conversationId: string,
  callback: (msgs: Message[]) => void
) {
  const colRef = collection(db, "chats", conversationId, "messages");
  const q = query(colRef, orderBy("timestamp", "asc"));

  const unsub = onSnapshot(q, (snapshot) => {
    const msgs: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data() as any;
      const ts = data.timestamp?.toDate?.() || new Date();
      return {
        id: doc.id, // use Firestore doc ID as string
        text: data.text,
        sender: data.sender,
        time: formatTime(ts), // convert timestamp to string
        blockchainTxHash: data.blockchainTxHash || undefined,
      };
    });
    callback(msgs);
  });

  return unsub; // call this to unsubscribe
}
