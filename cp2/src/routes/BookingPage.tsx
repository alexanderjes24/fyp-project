// src/routes/BookingPage.tsx
import { useState, useEffect } from "react";
import SessionBooking from "../components/SessionBooking";
import type { AvailableSlot } from "../types/data";
import { getAuth } from "firebase/auth";

interface Therapist {
  id: string;
  name: string;
}

export default function BookingPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  // -----------------------------
  // Fetch real therapists from backend
  // -----------------------------
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const res = await fetch("http://localhost:3000/booking/therapists");
        if (!res.ok) throw new Error("Failed to fetch therapists");

        const data = await res.json();

        // must be: { therapists: [{ id, name }] }
        setTherapists(data.therapists || []);
      } catch (err) {
        console.error("Failed to load therapists:", err);
        setTherapists([]); 
      }
    };

    fetchTherapists();
  }, []);

  // -----------------------------
  // Generate fixed time slots
  // -----------------------------
  useEffect(() => {
    if (!selectedTherapist) {
      setSlots([]);
      return;
    }

    const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"];

    const generated: AvailableSlot[] = timeSlots.map((time, idx) => ({
      id: idx + 1,
      time,
      type: "Video",
      therapistId: selectedTherapist,
    }));

    setSlots(generated);
  }, [selectedTherapist]);

  const therapist = therapists.find((t) => t.id === selectedTherapist);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold mb-4">Book a Session</h2>

      {/* Therapist Dropdown */}
      <select
        className="border px-3 py-2 rounded w-full mb-6"
        value={selectedTherapist}
        onChange={(e) => setSelectedTherapist(e.target.value)}
      >
        <option value="">Select therapist</option>
        {therapists.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* Booking Component */}
      {therapist && slots.length > 0 && (
        <SessionBooking
          therapistId={therapist.id}
          therapistName={therapist.name}
          initialSlots={slots}
        />
      )}

      {selectedTherapist && loadingSlots && <div>Loading available slots...</div>}
      {selectedTherapist && !loadingSlots && slots.length === 0 && (
        <div>No available slots for this therapist.</div>
      )}
    </div>
  );
}
