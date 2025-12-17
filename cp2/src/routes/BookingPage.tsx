import { useState, useEffect } from "react";
import SessionBooking from "../components/SessionBooking";
import type { AvailableSlot } from "../types/data";
import { getAuth } from "firebase/auth";
import { User, Calendar, Clock, ChevronDown, Sparkles } from "lucide-react";

interface Therapist {
  id: string;
  name: string;
}

export default function BookingPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);

  const auth = getAuth();

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const res = await fetch("http://localhost:3000/booking/therapists");
        if (!res.ok) throw new Error("Failed to fetch therapists");
        const data = await res.json();
        setTherapists(data.therapists || []);
      } catch (err) {
        console.error("Failed to load therapists:", err);
      } finally {
        setLoadingTherapists(false);
      }
    };
    fetchTherapists();
  }, []);

  useEffect(() => {
    if (!selectedTherapist) {
      setSlots([]);
      return;
    }

    const timeStrings = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"];
    const generated: AvailableSlot[] = timeStrings.flatMap((time, idx) => [
      { id: idx * 2, time, type: "Video", therapistId: selectedTherapist },
      { id: idx * 2 + 1, time, type: "Voice Call", therapistId: selectedTherapist }
    ]);
    setSlots(generated);
  }, [selectedTherapist]);

  const therapist = therapists.find((t) => t.id === selectedTherapist);

  if (loadingTherapists) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium tracking-wide">Finding available specialists...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-25 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Book your <span className="text-indigo-600">Session</span>
          </h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Choose a therapist and find a time that works best for your personal growth journey.
          </p>
        </div>

        {/* Selection Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <label className="block text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Step 1: Choose Your Therapist
          </label>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <User size={20} />
            </div>
            <select
              className="block w-full pl-11 pr-10 py-4 text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium"
              value={selectedTherapist}
              onChange={(e) => setSelectedTherapist(e.target.value)}
            >
              <option value="">Select a qualified specialist</option>
              {therapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
              <ChevronDown size={20} />
            </div>
          </div>
        </div>

        {/* Dynamic Content Section */}
        {!selectedTherapist ? (
          <div className="text-center py-16 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="inline-flex p-4 bg-indigo-50 text-indigo-500 rounded-full mb-4">
              <Sparkles size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Your journey starts here</h3>
            <p className="text-slate-500 text-sm">Select a therapist from above to see available time slots.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar size={24} />
                <h2 className="text-xl font-bold">Available Slots</h2>
              </div>
              <div className="flex items-center gap-2 bg-indigo-500/30 px-3 py-1 rounded-lg text-sm font-medium border border-indigo-400/30">
                <Clock size={16} />
                Current Local Time
              </div>
            </div>
            
            <div className="p-2">
              <SessionBooking
                therapistId={therapist?.id || ""}
                therapistName={therapist?.name || ""}
                initialSlots={slots}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}