import { useEffect, useState, useMemo } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { Booking, Message } from "../types/data";
import ChatInterface from "../components/ChatInterface";
import { Link } from "react-router-dom";

// --- TYPE DEFINITIONS ---
interface MedicalRecordVerification {
  isVerified: boolean;
  status: string;
  onChainHash: string | null;
  localCalculatedHash: string | null;
  timestamp: string | null;
}

interface MedicalRecord {
  bookingId: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  blockchainHash: string;
  txHash: string;
  verification: MedicalRecordVerification;
}

export default function UserDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // --- MEDICAL RECORD STATE ---
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<MedicalRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);


  const auth = getAuth();

  // ------------------------------------
  // 🚀 DERIVED STATE (Active vs. History)
  // ------------------------------------
  const activeBookings = useMemo(() => {
    // These are the bookings that need action/are upcoming (not cancelled or completed)
    return bookings.filter(b => b.status !== "cancelled" && b.status !== "completed");
  }, [bookings]);

  const historyBookings = useMemo(() => {
    // These are completed or cancelled bookings (history), sorted by date (most recent first)
    return bookings
      .filter(b => b.status === "cancelled" || b.status === "completed")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);


  // ------------------------------------
  // 🎣 FETCH DATA & AUTHENTICATION
  // ------------------------------------
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
  }, [auth]);

  // ------------------------------------
  // 📝 HANDLERS
  // ------------------------------------

  // Fetch and Verify Medical Record
  const handleViewRecord = async (bookingId: string) => {
    setActiveRecord(null);
    setRecordLoading(true);
    setIsRecordModalOpen(true);

    try {
      // Calls the backend route that fetches from Firestore AND verifies the hash on the blockchain
      const res = await fetch(`http://localhost:3000/booking/medical-record?bookingId=${bookingId}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch medical record");
      }

      const data: MedicalRecord = await res.json();
      setActiveRecord(data);

    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error fetching and verifying medical record.");
      setActiveRecord(null);
    } finally {
      setRecordLoading(false);
    }
  };

  // Cancel booking
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

  // Open Chat
  const handleOpenChat = async (bookingId: string) => {
    if (!userId) return;

    setSelectedBookingId(bookingId);
    setIsChatOpen(true);

    try {
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

  // Send Chat Message
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

  // ------------------------------------
  // 🖼️ RENDER HELPERS
  // ------------------------------------
  const renderVerificationBadge = (verification: MedicalRecordVerification) => {
    if (verification.isVerified) {
      return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
          Verified on Chain
        </span>
      );
    } else if (verification.onChainHash) {
      return (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
          Verification Failed
        </span>
      );
    }
    return null;
  };

  const renderVerificationDetails = (verification: MedicalRecordVerification) => (
    <div className="mt-4 p-3 border-t bg-gray-50 rounded">
      <h4 className={`font-semibold ${verification.isVerified ? 'text-green-700' : 'text-red-700'}`}>
        Verification Status: {verification.status}
      </h4>
      {verification.onChainHash && (
        <>
          <p className="text-xs text-gray-700 mt-1">
            **Proof Hash on Blockchain:** <code className="break-all">{verification.onChainHash}</code>
          </p>
          <p className="text-xs text-gray-700">
            **Local Calculated Hash:** <code className="break-all">{verification.localCalculatedHash}</code>
          </p>
          {verification.timestamp && (
              <p className="text-xs text-gray-700">
                  **Time Stamped:** {new Date(verification.timestamp).toLocaleString()}
              </p>
          )}
          <p className="text-xs text-gray-700 mt-2">
            **Transaction:** <code className="break-all">{activeRecord?.txHash}</code>
          </p>
        </>
      )}
    </div>
  );

  // Empty State UI
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-12 bg-white border border-dashed border-gray-300 rounded-xl shadow-sm text-center">
      <svg className="w-16 h-16 text-indigo-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No Upcoming Appointments
      </h3>
      <p className="text-gray-600 mb-6">
        You're all caught up! Book your next appointment to continue your wellness journey.
      </p>
      <Link to="/book-session">
      <button
        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-full hover:bg-indigo-700 transition duration-150"
      >
        Book Your First Appointment
      </button>
      </Link>
    </div>
  );

  /**
   * Renders a standardized booking card. Button colors are tailored based on isHistory flag.
   */
  const renderBookingCard = (b: Booking, isHistory: boolean) => {
    const statusTextClass = b.status === 'completed' ? 'text-green-700' 
                          : b.status === 'cancelled' ? 'text-red-700' 
                          : 'text-indigo-600';

    return (
      <div 
        key={b.id} 
        // Consistent card style. Active has a bold left border. History has slight opacity.
        className={`p-4 bg-white rounded shadow flex justify-between items-center ${isHistory ? 'opacity-85' : 'border-l-4 border-indigo-500'}`}
      >
        {/* Left Side: Details */}
        <div>
          <div className="font-semibold">{b.date} • {b.time}</div>
          <div className="text-sm text-gray-600">{b.type} • Therapist: {b.therapistName}</div>
          <div className={`text-sm font-medium ${statusTextClass}`}>Status: {b.status.toUpperCase()}</div>
        </div>

        {/* Right Side: Actions */}
        <div className="space-y-2 flex flex-col items-end">
          
          {/* Actions for Active Bookings (Primary Colors) */}
          {!isHistory && (
            <>
              <button
                onClick={() => handleCancel(b.id)}
                className="px-3 py-1 bg-red-400 text-white text-sm rounded hover:bg-red-700 transition"
              >
                Cancel Appointment
              </button>
              <button
                onClick={() => handleOpenChat(b.id)}
                className="px-3 py-1 bg-blue-200 text-blue-800 text-sm rounded hover:bg-blue-300 transition"
              >
                Chat
              </button>
            </>
          )}

          {/* Actions for History Bookings (Subdued Colors) */}
          {isHistory && (
            <>
              {b.status === "completed" && (
                <button
                  onClick={() => handleViewRecord(b.id)}
                  // Subdued purple for history View Record
                  className="px-3 py-1 bg-purple-200 text-purple-800 text-sm rounded hover:bg-purple-300 transition"
                >
                  View Record
                </button>
              )}
              <button
                onClick={() => handleOpenChat(b.id)}
                // Subdued blue for history Chat
                className="px-3 py-1 bg-blue-200 text-blue-800 text-sm rounded hover:bg-blue-300 transition"
              >
                Chat
              </button>
            </>
          )}

        </div>
      </div>
    );
  };

  // ------------------------------------
  // 🚫 LOADING & ERROR GUARDS
  // ------------------------------------
  if (!userId) {
    return (
      <div className="p-6 text-center text-red-600">
        Error: User not logged in.
      </div>
    );
  }

  if (loading) return <div className="p-6 text-center">Loading bookings...</div>;


  // ------------------------------------
  // 💻 MAIN RENDER
  // ------------------------------------
  return (
    <div className="pt-20 relative flex min-h-screen">
      {/* ---------- MAIN BOOKINGS / EMPTY STATE CONTAINER (Center/Top) ---------- */}
      <div className={`flex-1 p-6 max-w-2xl mx-auto w-full ${activeBookings.length === 0 ? 'flex flex-col' : 'space-y-4'}`}>
        
        {/* Section 1: Active Appointments (Top) or Empty State (Centered) */}
        {activeBookings.length > 0 && (
          <h2 className="text-2xl font-bold mb-4">Upcoming Appointments 🗓️</h2>
        )}
        
        {activeBookings.length > 0 ? (
          // Active Booking List
          activeBookings.map((b) => renderBookingCard(b, false))
        ) : (
          // Empty State (Centered using flex-grow)
          <div className="flex flex-col items-center justify-center flex-grow">
            {renderEmptyState()}
          </div>
        )}

        {/* --- History Section (Always Downward, below Active/Empty State) --- */}
        {historyBookings.length > 0 && (
          <div className="pt-8 space-y-3 border-t mt-8 border-gray-200">
            <h3 className="text-xl font-bold text-gray-700">Booking History 📜 ({historyBookings.length})</h3>
            <div className="space-y-2">
              {/* History Booking List */}
              {historyBookings.map((b) => renderBookingCard(b, true))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------ */}
      {/* 💬 CHAT PANEL (Sidebar) */}
      {/* ------------------------------------ */}
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

      {/* 📄 MEDICAL RECORD MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-bold">Medical Record</h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-gray-600 hover:text-gray-900 font-bold"
              >
                ✕
              </button>
            </div>

            {recordLoading && <p className="text-center">Loading record and verifying on blockchain...</p>}

            {!recordLoading && activeRecord && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        Booking ID: <code className="font-mono">{activeRecord.bookingId}</code>
                    </p>
                    {renderVerificationBadge(activeRecord.verification)}
                </div>

                <div>
                  <h4 className="font-semibold text-lg border-b mb-1">Diagnosis</h4>
                  <p>{activeRecord.diagnosis}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-lg border-b mb-1">Prescription</h4>
                  <p>{activeRecord.prescription}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-lg border-b mb-1">Notes</h4>
                  <p>{activeRecord.notes}</p>
                </div>

                {renderVerificationDetails(activeRecord.verification)}

              </div>
            )}

            {!recordLoading && !activeRecord && (
                <p className="text-red-500">Could not load medical record details.</p>
            )}

          </div>
        </div>
      )}
    </div>
  );
}