import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { Booking, Message } from "../types/data";
import ChatInterface from "../components/ChatInterface";

// --- NEW TYPE FOR MEDICAL RECORD RESPONSE ---
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

export default function UserDashboard() { // RENAMED COMPONENT
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // --- NEW STATE FOR RECORD VIEWING ---
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<MedicalRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);


  const auth = getAuth();

  // ---------------------
  // Wait for Firebase Auth & Fetch Bookings
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
  }, [auth]);

  // ---------------------
  // Fetch and Verify Medical Record
  // ---------------------
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
  // Open Chat (Unchanged)
  // ---------------------
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

  // ---------------------
  // Send Chat Message (Unchanged)
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
  // UI Loading/Error States
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


  // ---------------------
  // UI Components
  // ---------------------
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


  // ---------------------
  // MAIN RENDER
  // ---------------------
  return (
    <div className="relative flex">
      {/* ---------- MAIN BOOKINGS ---------- */}
      <div className="flex-1 p-6 max-w-2xl space-y-4">
        <h2 className="text-2xl font-bold mb-4">My Dashboard</h2>
        {bookings.map((b) => (
          <div key={b.id} className="p-4 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{b.date} • {b.time}</div>
              <div className="text-sm text-gray-600">{b.type} • Therapist: {b.therapistName}</div>
              <div className="text-sm text-gray-500">Status: {b.status}</div>
            </div>
            <div className="space-y-2 flex flex-col items-end">
              {b.status === "completed" && (
                <button
                  onClick={() => handleViewRecord(b.id)}
                  className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  View Record
                </button>
              )}
              {b.status !== "cancelled" && b.status !== "completed" && (
                <button
                  onClick={() => handleCancel(b.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Cancel
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

      {/* ---------- CHAT PANEL (Unchanged) ---------- */}
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

      {/* ---------- MEDICAL RECORD MODAL (NEW) ---------- */}
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