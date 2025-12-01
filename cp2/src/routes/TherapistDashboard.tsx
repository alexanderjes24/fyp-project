import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { Booking, Message } from "../types/data";
import ChatInterface from "../components/ChatInterface";

export default function TherapistDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [therapistId, setTherapistId] = useState<string | null>(null);

  const auth = getAuth();

  // ---------------------
  // Wait for Firebase Auth to initialize
  // ---------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setTherapistId(user.uid);
      } else {
        setTherapistId(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ---------------------
  // Fetch Therapist Bookings
  // ---------------------
  useEffect(() => {
    if (!therapistId) return;

    async function loadBookings() {
      try {
        const res = await fetch(
          `http://localhost:3000/booking/therapist?therapistId=${therapistId}`
        );

        if (!res.ok) {
          console.error("Failed to fetch therapist bookings");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (err) {
        console.error("Error loading bookings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, [therapistId]);

  // ---------------------
  // Resolve Booking
  // ---------------------
  const handleResolve = async (bookingId: string) => {
    try {
      await fetch(`http://localhost:3000/booking/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, therapistId }),
      });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "completed" } : b
        )
      );
    } catch (err) {
      console.error("Failed to resolve booking:", err);
    }
  };

  // ---------------------
  // Open Chat
  // ---------------------
  const handleOpenChat = async (bookingId: string) => {
    if (!therapistId) return;

    setSelectedBookingId(bookingId);
    setIsChatOpen(true);

    try {
      // Pass therapistId for backend verification
      const res = await fetch(`http://localhost:3000/chat/${bookingId}?therapistId=${therapistId}`);
      if (!res.ok) throw new Error("Failed to load chat");

      const data = await res.json();
      // Map timestamp to time string if needed
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
    if (!selectedBookingId || !therapistId) return;

    try {
      await fetch(`http://localhost:3000/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: selectedBookingId,
          sender: "therapist",
          text,
          therapistId, // verify backend
        }),
      });

      // Reload chat messages after sending
      const res = await fetch(`http://localhost:3000/chat/${selectedBookingId}?therapistId=${therapistId}`);
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
  if (!therapistId) {
    return (
      <div className="p-6 text-center text-red-600">
        Error: Therapist not logged in.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-lg">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative flex">
      {/* ---------- MAIN DASHBOARD ---------- */}
      <div className="flex-1 p-6 space-y-6 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">Therapist Dashboard</h2>

        {bookings.length === 0 && (
          <p className="text-gray-500">No bookings yet.</p>
        )}

        {bookings.map((b) => (
          <div
            key={b.id}
            className="p-4 border rounded bg-white flex justify-between items-center shadow-sm"
          >
            <div>
              <p><strong>User:</strong> {b.userId}</p>
              <p><strong>Date:</strong> {b.date} {b.time}</p>
              <p><strong>Status:</strong> {b.status}</p>
            </div>

            <div className="flex gap-2">
              {b.status !== "completed" && (
                <button
                  onClick={() => handleResolve(b.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Resolve
                </button>
              )}

              <button
                onClick={() => handleOpenChat(b.id)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
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
