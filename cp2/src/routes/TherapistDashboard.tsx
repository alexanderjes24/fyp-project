import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { Booking, Message } from "../types/data";
import ChatInterface from "../components/ChatInterface";
import CallInterface from "../components/CallInterface";
import MedicalRecordModal from "../components/MedicalRecord";
import type { MedicalRecordData } from "../components/MedicalRecord";
import { ListChecks, Eye, FileText, ShieldCheck, X, Video, MessageSquare, Clipboard } from 'lucide-react';

interface QuizResponse {
  answers: { question: string; answer: string }[];
  lastTaken: string;
}

// Updated to match your User Side structure
interface ViewRecordData {
  diagnosis: string;
  prescription: string;
  notes: string;
  blockchainHash?: string;
  timestamp?: number;
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
  
  // State for viewing the record
  const [viewingRecord, setViewingRecord] = useState<ViewRecordData | null>(null);

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
    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    if (!therapistId) return;
    loadBookings();
  }, [therapistId]);

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

  // FETCH RECORD LOGIC
  const handleViewRecord = async (bookingId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3000/therapist/medical-record/${bookingId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Record not found on blockchain yet.");
      const data = await res.json();
      setViewingRecord(data.record);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartSession = (bookingId: string) => {
    setActiveCallId(bookingId);
    setSelectedBookingId(bookingId);
  };

  const handleEndCall = () => {
    setShowRecordForm(true);
  };

  const handleSubmitRecord = async (recordData: MedicalRecordData) => {
    const submissionId = activeCallId || selectedBookingId;
    if (!submissionId || !therapistId) return;

    setIsSubmittingBlock(true);
    const user = auth.currentUser;
    if (!user) return;

    try {
      const token = await user.getIdToken(); 
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

      if (!recordRes.ok) throw new Error("Blockchain storage failed");

      await fetch(`http://localhost:3000/booking/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: submissionId, therapistId }),
      });

      setBookings((prev) =>
        prev.map((b) => (b.id === submissionId ? { ...b, status: "completed" } : b))
      );

      setShowRecordForm(false);
      setActiveCallId(null);
      alert("Success! Medical record secured on blockchain.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Loading...</div>;
  if (!therapistId) return <div className="p-10 text-center text-red-500">Access Denied</div>;

  return (
    <div className="relative flex min-h-screen bg-slate-50 pt-16">
      <div className="flex-1 p-8 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-800 mb-8">Therapist Dashboard</h2>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {bookings.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No appointments found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <div key={b.id} className="p-6 flex flex-col lg:flex-row justify-between items-center hover:bg-slate-50 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                      {b.userId.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Patient: {b.userId.slice(0, 8)}...</p>
                      <p className="text-xs text-slate-500 font-medium tracking-tight uppercase">
                        📅 {b.date} • ⏰ {b.time} • <span className={b.status === 'completed' ? 'text-green-600' : 'text-amber-600'}>{b.status}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 lg:mt-0">
                    {b.status === "completed" && (
                      <button 
                        onClick={() => handleViewRecord(b.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold transition-all shadow-md shadow-emerald-100"
                      >
                        <Eye size={16} /> View Record
                      </button>
                    )}
                    <button onClick={() => handleViewQuiz(b.userId)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-semibold">
                      <ListChecks size={16} /> Quiz
                    </button>
                    {b.status !== "completed" && b.status !== "cancelled" && (
                      <button onClick={() => handleStartSession(b.id)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold">
                        <Video size={16} /> Start
                      </button>
                    )}
                    <button onClick={() => handleOpenChat(b.id)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-semibold">
                      Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* VIEW RECORD MODAL - Matches User Side Logic */}
      {viewingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-emerald-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clipboard size={20} />
                <h3 className="text-lg font-bold">Medical Record</h3>
              </div>
              <button onClick={() => setViewingRecord(null)} className="hover:bg-black/10 rounded-full p-1"><X size={24} /></button>
            </div>
            
            <div className="p-8 space-y-6">
                {/* Follows your User Side request exactly */}
                <div>
                  <h4 className="font-semibold text-lg border-b mb-1 text-slate-900">Diagnosis</h4>
                  <p className="text-slate-700 py-2 leading-relaxed">{viewingRecord.diagnosis}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-lg border-b mb-1 text-slate-900">Prescription</h4>
                  <p className="text-slate-700 py-2 leading-relaxed">{viewingRecord.prescription}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-lg border-b mb-1 text-slate-900">Notes</h4>
                  <p className="text-slate-700 py-2 leading-relaxed">{viewingRecord.notes}</p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-widest mb-2">
                    <ShieldCheck size={14} /> Blockchain Verified Record
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono break-all bg-slate-50 p-3 rounded-lg border border-slate-100">
                    HASH: {viewingRecord.blockchainHash || "Record sync confirmed on immutable ledger."}
                  </p>
                </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setViewingRecord(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDE CHAT */}
      <div className={`fixed inset-y-0 right-0 w-[380px] bg-white shadow-2xl transform transition-transform duration-300 z-50 border-l border-slate-200 ${isChatOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col h-full pt-16">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Patient Chat</h3>
            <button onClick={() => setIsChatOpen(false)}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatInterface messages={chatMessages} onSendMessage={handleSendMessage} />
          </div>
        </div>
      </div>

      {/* MODALS */}
      {activeCallId && !showRecordForm && <CallInterface onEndCall={handleEndCall} />}
      {showRecordForm && <MedicalRecordModal onSubmit={handleSubmitRecord} isSubmitting={isSubmittingBlock} />}
      {showQuizModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8 relative">
            <button onClick={() => setShowQuizModal(false)} className="absolute top-4 right-4 text-slate-400"><X size={24} /></button>
            <h3 className="text-2xl font-bold mb-6">Quiz Results</h3>
            <div className="space-y-4">
              {quizResponses?.answers.map((qa, i) => (
                <div key={i} className="border-b pb-4">
                  <p className="font-bold text-slate-800">Q: {qa.question}</p>
                  <p className="text-indigo-600 bg-indigo-50 p-3 rounded-lg mt-2 font-medium">A: {qa.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}