import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { Booking, Message } from "../types/data";
import ChatInterface from "../components/ChatInterface";

// --- NEW IMPORTS ---
import CallInterface from "../components/CallInterface";
import MedicalRecordModal from "../components/MedicalRecord";
import type{ MedicalRecordData } from "../components/MedicalRecord";
export default function TherapistDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [therapistId, setTherapistId] = useState<string | null>(null);

  // --- NEW STATE for Call & Records ---
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  const auth = getAuth();

  // 1. Auth & Initial Load
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

  useEffect(() => {
    if (!therapistId) return;
    async function loadBookings() {
      try {
        const res = await fetch(
          `http://localhost:3000/booking/therapist?therapistId=${therapistId}`
        );
        if (res.ok) {
          const data = await res.json();
          setBookings(data.bookings || []);
        }
      } catch (err) {
        console.error("Error loading bookings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [therapistId]);

  // 2. Chat Functions
  const handleOpenChat = async (bookingId: string) => {
    if (!therapistId) return;
    setSelectedBookingId(bookingId);
    setIsChatOpen(true);
    try {
      const res = await fetch(`http://localhost:3000/chat/${bookingId}?therapistId=${therapistId}`);
      if (res.ok) {
        const data = await res.json();
        const msgs: Message[] = data.messages.map((m: any) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          blockchainTxHash: m.blockchainTxHash,
        }));
        setChatMessages(msgs);
      }
    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedBookingId || !therapistId) return;
    try {
      await fetch(`http://localhost:3000/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedBookingId, sender: "therapist", text, therapistId }),
      });
      handleOpenChat(selectedBookingId);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // 3. New Workflow Logic
  const handleStartSession = (bookingId: string) => {
    setActiveCallId(bookingId);
  };

  const handleEndCall = () => {
    setShowRecordForm(true); 
  };

  const handleSubmitRecord = async (recordData: MedicalRecordData) => {
    if (!activeCallId || !therapistId) return;
    setIsSubmittingBlock(true);

    const user = auth.currentUser;
    if (!user) {
        alert("Authentication error. User not found. Please log in again.");
        setIsSubmittingBlock(false);
        return;
    }

    try {
        // Fetch the user's ID token for backend authorization
        const token = await user.getIdToken(); 

        // 1. Send Record to Backend (This handles hashing and blockchain storage)
        const recordRes = await fetch(`http://localhost:3000/therapist/medical-record/create`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // 🚨 FIX: Adding the necessary token
            },
            body: JSON.stringify({
                bookingId: activeCallId,
                therapistId,
                ...recordData
            }),
        });

        if (!recordRes.ok) {
            const errorData = await recordRes.json().catch(() => ({}));
            // Provide a better error message if the backend sends one
            throw new Error(errorData.error || `Failed to store medical record. Status: ${recordRes.status}`);
        }

        // 2. Resolve the booking
        await fetch(`http://localhost:3000/booking/resolve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: activeCallId, therapistId }),
        });

        setBookings((prev) =>
            prev.map((b) => (b.id === activeCallId ? { ...b, status: "completed" } : b))
        );

        setShowRecordForm(false);
        setActiveCallId(null);
        alert("Session completed! Medical record hashed and secured on blockchain.");

    } catch (err: any) {
        console.error("Error in session completion:", err);
        alert(err.message || "Error saving record. Please try again.");
    } finally {
        setIsSubmittingBlock(false);
    }
};

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!therapistId) return <div className="p-10 text-center text-red-500">Access Denied</div>;

  return (
    <div className="relative flex min-h-screen bg-gray-50">
      <div className="flex-1 p-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Therapist Dashboard</h2>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No upcoming appointments.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <div key={b.id} className="p-6 flex flex-col md:flex-row justify-between items-center hover:bg-gray-50 transition-colors">
                  <div className="mb-4 md:mb-0">
                    <p className="text-lg font-semibold text-gray-800">Patient ID: <span className="text-indigo-600">{b.userId.slice(0, 8)}...</span></p>
                    <div className="text-sm text-gray-500 mt-1 space-x-4">
                        <span>📅 {b.date}</span>
                        <span>⏰ {b.time}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            b.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            {b.status.toUpperCase()}
                        </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {b.status !== "completed" && (
                      <button
                        onClick={() => handleStartSession(b.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
                      >
                        <span>📹</span> Start Session
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenChat(b.id)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CHAT SIDEBAR */}
      <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${isChatOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center bg-indigo-50">
                <h3 className="font-semibold text-indigo-900">Patient Chat</h3>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-hidden">
                {selectedBookingId ? (
                    <ChatInterface messages={chatMessages} onSendMessage={handleSendMessage} />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">Select a chat</div>
                )}
            </div>
        </div>
      </div>

      {/* --- NEW MODALS --- */}
      {activeCallId && !showRecordForm && (
        <CallInterface onEndCall={handleEndCall} />
      )}

      {showRecordForm && activeCallId && (
        <MedicalRecordModal onSubmit={handleSubmitRecord} isSubmitting={isSubmittingBlock} />
      )}
    </div>
  );
}