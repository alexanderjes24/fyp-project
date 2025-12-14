// TherapistDashboard.tsx

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { Booking, Message } from "../types/data";
import ChatInterface from "../components/ChatInterface";

// --- NEW IMPORTS ---
import CallInterface from "../components/CallInterface";
import MedicalRecordModal from "../components/MedicalRecord";
import type{ MedicalRecordData } from "../components/MedicalRecord";
import { ListChecks } from 'lucide-react'; // X icon removed as requested

// Define a type for a simplified Quiz Result
interface QuizResponse {
// score: number; <--- REMOVED
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

  // --- STATE for Call, Records, & QUIZ ---
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false); // State for the Quiz Modal
  const [quizResponses, setQuizResponses] = useState<QuizResponse | null>(null); // State for quiz data (RENAMED)
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null); 

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
      // Re-fetch chat messages to update UI
      handleOpenChat(selectedBookingId);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // 3. Quiz Viewing Logic 
  const handleViewQuiz = async (userId: string) => {
    setCurrentPatientId(userId);
    setShowQuizModal(true);
    setQuizResponses(null); // Clear previous results while loading (RENAMED)

    const user = auth.currentUser;
    if (!user) {
        alert("Authentication required. Please log in again.");
        setShowQuizModal(false);
        return;
    }

    try {
        const token = await user.getIdToken(); 

        const res = await fetch(`http://localhost:3000/therapist/quiz-results?userId=${userId}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        });
      
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const errorMessage = errorData.error || `Failed to fetch quiz results. Status: ${res.status}`;
            throw new Error(errorMessage);
        }
      
        const data = await res.json();
        // Setting default answers if data.quiz is null/undefined
        setQuizResponses(data.quiz || { // RENAMED
          answers: [{ question: "No quiz data available.", answer: "" }],
          lastTaken: "N/A"
        });

    } catch (err: any) {
        console.error("Error loading quiz data:", err);
        // Display error to user
        alert(`Error loading quiz: ${err.message}`); 
        setQuizResponses({ // RENAMED
          answers: [{ question: "Error loading quiz data.", answer: err.message || "Unknown error" }],
          lastTaken: "N/A"
        });
    }
  };


  // 4. Session & Record Submission Logic
  const handleStartSession = (bookingId: string) => {
    setActiveCallId(bookingId);
  };

  const handleEndCall = () => {
    setShowRecordForm(true); 
    setActiveCallId(null);
  };

  const handleSubmitRecord = async (recordData: MedicalRecordData) => {
    const submissionId = activeCallId || selectedBookingId; 

    if (!submissionId || !therapistId) return;
    setIsSubmittingBlock(true);

    const user = auth.currentUser;
    if (!user) {
        alert("Authentication error. User not found. Please log in again.");
        setIsSubmittingBlock(false);
        return;
    }

    try {
        const token = await user.getIdToken(); 

        // 1. Send Record to Backend 
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
            const errorData = await recordRes.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to store medical record. Status: ${recordRes.status}`);
        }

        // 2. Resolve the booking
        await fetch(`http://localhost:3000/booking/resolve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId: submissionId, therapistId }),
        });

        setBookings((prev) =>
            prev.map((b) => (b.id === submissionId ? { ...b, status: "completed" } : b))
        );

        setShowRecordForm(false);
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
                    {/* NEW: View Quiz Button */}
                    <button
                        onClick={() => handleViewQuiz(b.userId)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all shadow-sm hover:shadow-md text-sm"
                    >
                        <ListChecks className="w-4 h-4" /> View Quiz
                    </button>
                    
                    {b.status !== "completed" && (
                      <button
                        onClick={() => handleStartSession(b.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md text-sm"
                      >
                        <span>📹</span> Start Session
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenChat(b.id)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm"
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
                <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl font-light">&times;</button>
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

      {showRecordForm && (
        <MedicalRecordModal onSubmit={handleSubmitRecord} isSubmitting={isSubmittingBlock} />
      )}

      {/* NEW: Quiz Results Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-900">Patient Quiz Results</h3>
              <button onClick={() => setShowQuizModal(false)} className="text-gray-400 hover:text-gray-700 text-3xl font-light">
                &times; 
              </button>
            </div>
            
            <div className="p-6">
              {!quizResponses ? ( // RENAMED
                <p className="text-center text-gray-500">Loading quiz data...</p>
              ) : (
                <div>
                  <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    {/* Updated header since score is removed */}
                    <p className="font-semibold text-lg text-indigo-800">Latest Assessment Details</p> 
                    <p className="text-sm text-gray-600">Last Taken: {quizResponses.lastTaken}</p> // RENAMED
                  </div>

                  <h4 className="text-xl font-semibold mt-6 mb-3 text-gray-800">Detailed Answers:</h4>
                  <div className="space-y-4">
                    {quizResponses.answers.length > 0 ? ( // RENAMED
                        quizResponses.answers.map((qa, index) => ( // RENAMED
                            <div key={index} className="border-b pb-4">
                                <p className="font-medium text-gray-700">Q{index + 1}: {qa.question}</p>
                                <p className="text-indigo-600 bg-indigo-50 p-2 mt-1 rounded text-sm">A: {qa.answer}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No detailed answers found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t text-right">
              <button onClick={() => setShowQuizModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}