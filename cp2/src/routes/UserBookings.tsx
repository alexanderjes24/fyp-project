import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { Booking, Message } from "../types/data";
import ChatInterface from "../components/ChatInterface";

export default function UserBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const auth = getAuth();

  // ---------------------
  // Wait for Firebase Auth
  // ---------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserId(null);
        setBookings([]);
        setLoading(false);
        return;
      }

      setUserId(user.uid);

      try {
        const res = await fetch(`http://localhost:3000/booking?userId=${user.uid}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch bookings");
        }

        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (err: any) {
        console.error(err);
        alert(err.message || "Error fetching bookings");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ---------------------
  // Cancel booking
  // ---------------------
  const handleCancel = async (bookingId: string) => {
    if (!userId) return;

    try {
      const res = await fetch("http://localhost:3000/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking");

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to cancel booking");
    }
  };

  // ---------------------
  // Open Chat
  // ---------------------
  const handleOpenChat = async (bookingId: string) => {
    if (!userId) return;

    setSelectedBookingId(bookingId);
    setIsChatOpen(true);

    try {
      // Pass userId for backend verification
      const res = await fetch(`http://localhost:3000/chat/${bookingId}?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to load chat");

      const data = await res.json();
      const msgs: Message[] = data.messages.map((m: any) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        blockchainTxHash: m.blockchainTxHash || undefined,
      }));
      setChatMessages(msgs);
    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  };

  // ---------------------
  // Send Chat Message
  // ---------------------
  const handleSendMessage = async (text: string) => {
    if (!selectedBookingId || !userId) return;

    try {
      await fetch(`http://localhost:3000/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: selectedBookingId,
          sender: "user",
          text,
          userId, // verify backend
        }),
      });

      // Reload chat messages after sending
      const res = await fetch(`http://localhost:3000/chat/${selectedBookingId}?userId=${userId}`);
      const data = await res.json();
      const msgs: Message[] = data.messages.map((m: any) => ({
        id: m.id,
        sender: m.sender,
        text: m.text,
        time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        blockchainTxHash: m.blockchainTxHash || undefined,
      }));
      setChatMessages(msgs);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // ---------------------
  // UI
  // ---------------------
  if (!userId) {
    return (
      <div className="p-6 text-center text-red-600">
        Error: User not logged in.
      </div>
    );
  }

  if (loading) return <div className="p-6 text-center">Loading bookings...</div>;
  if (!bookings.length) return <div className="p-6 text-center">No bookings found.</div>;

  return (
    <div className="relative flex">
      {/* ---------- MAIN BOOKINGS ---------- */}
      <div className="flex-1 p-6 max-w-2xl space-y-4">
        <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
        {bookings.map((b) => (
          <div key={b.id} className="p-4 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{b.date} • {b.time}</div>
              <div className="text-sm text-gray-600">{b.type} • Therapist: {b.therapistName}</div>
              <div className="text-sm text-gray-500">Status: {b.status}</div>
            </div>
            <div className="space-y-2 flex flex-col items-end">
              {b.status !== "cancelled" && b.status !== "completed" && (
                <button
                  onClick={() => handleCancel(b.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => handleOpenChat(b.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- CHAT PANEL ---------- */}
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl border-l transform transition-transform duration-300 z-50
        ${isChatOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">Chat</h3>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-gray-600 hover:text-gray-900 font-bold"
            >
              ✕
            </button>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 overflow-y-auto">
            {selectedBookingId ? (
              <ChatInterface
                messages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <p className="p-4 text-gray-500">Select a booking to chat.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
