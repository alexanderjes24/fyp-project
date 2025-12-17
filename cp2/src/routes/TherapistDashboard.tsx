// TherapistDashboard.tsx

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { Booking, Message } from "../types/data";
import ChatInterface from "../components/ChatInterface";
import CallInterface from "../components/CallInterface";
import MedicalRecordModal from "../components/MedicalRecord";
import type { MedicalRecordData } from "../components/MedicalRecord";
import { ListChecks } from 'lucide-react';

interface QuizResponse {
  answers: { question: string; answer: string }[];
  lastTaken: string;
}

export default function TherapistDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [therapistId, setTherapistId] = useState<string | null>(null);

  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizResponses, setQuizResponses] = useState<QuizResponse | null>(null);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);

  const auth = getAuth();

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
        const res = await fetch(`http://localhost:3000/booking/therapist?therapistId=${therapistId}`);
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

  const handleViewQuiz = async (userId: string) => {
    setCurrentPatientId(userId);
    setShowQuizModal(true);
    setQuizResponses(null);
    const user = auth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3000/therapist/quiz-results?userId=${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch quiz");
      const data = await res.json();
      setQuizResponses(data.quiz || { answers: [], lastTaken: "N/A" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSession = (bookingId: string) => {
    console.log("Starting Session for:", bookingId);
    setActiveCallId(bookingId);
    setSelectedBookingId(bookingId); // Keep this in sync
  };

  const handleEndCall = () => {
    console.log("Call Ended. Opening Record Form...");
    setShowRecordForm(true);
    // 🚨 WE DO NOT SET activeCallId to null here anymore! 
    // We need it for the next step.
  };

  const handleSubmitRecord = async (recordData: MedicalRecordData) => {
    // 🔍 Step 1: Verification
    const submissionId = activeCallId || selectedBookingId;
    console.log("Submit clicked. Using ID:", submissionId);

    if (!submissionId || !therapistId) {
      alert("Error: No active booking ID found for submission.");
      return;
    }

    setIsSubmittingBlock(true);
    const user = auth.currentUser;
    if (!user) {
        alert("Session expired. Please log in.");
        setIsSubmittingBlock(false);
        return;
    }

    try {
        const token = await user.getIdToken(); 
        console.log("Sending data to backend...");

        // 🔍 Step 2: Blockchain Storage
        const recordRes = await fetch(`http://localhost:3000/therapist/medical-record/create`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, 
            },
            body: JSON.stringify({
                bookingId: submissionId,
                therapistId,
                ...recordData
            }),
        });

        if (!recordRes.ok) {
            const errorData = await recordRes.json();
            throw new Error(errorData.error || "Blockchain storage failed");
        }

        console.log("Blockchain Success. Resolving Booking...");

        // 🔍 Step 3: Resolve Database Status
        await fetch(`http://localhost:3000/booking/resolve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: submissionId, therapistId }),
        });

        setBookings((prev) =>
            prev.map((b) => (b.id === submissionId ? { ...b, status: "completed" } : b))
        );

        // ✅ Final Step: Cleanup
        setShowRecordForm(false);
        setActiveCallId(null); // Now we can safely clear it
        alert("Success! Medical record secured on blockchain.");

    } catch (err: any) {
        console.error("Submission Error:", err);
        alert(err.message);
    } finally {
        setIsSubmittingBlock(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!therapistId) return <div className="p-10 text-center text-red-500">Access Denied</div>;

  return (
    <div className="relative flex min-h-screen bg-gray-50 pt-15">
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
                    <button onClick={() => handleViewQuiz(b.userId)} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all text-sm">
                        <ListChecks className="w-4 h-4" /> View Quiz
                    </button>
                    
                    {b.status !== "completed" && b.status !== "cancelled" && (
                      <button onClick={() => handleStartSession(b.id)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm">
                        <span>📹</span> Start Session
                      </button>
                    )}
                    <button onClick={() => handleOpenChat(b.id)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm">
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
      {/* MODALS */}
      {activeCallId && !showRecordForm && (
        <CallInterface onEndCall={handleEndCall} />
      )}

      {showRecordForm && (
        <MedicalRecordModal onSubmit={handleSubmitRecord} isSubmitting={isSubmittingBlock} />
      )}

      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Patient Quiz Results</h3>
              <button onClick={() => setShowQuizModal(false)} className="text-gray-400 hover:text-gray-700 text-3xl font-light">&times;</button>
            </div>
            <div className="p-6">
              {!quizResponses ? <p>Loading...</p> : (
                <div className="space-y-4">
                  {quizResponses.answers.map((qa, i) => (
                    <div key={i} className="border-b pb-4">
                      <p className="font-medium text-gray-700">Q: {qa.question}</p>
                      <p className="text-indigo-600 bg-indigo-50 p-2 mt-1 rounded text-sm">A: {qa.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}