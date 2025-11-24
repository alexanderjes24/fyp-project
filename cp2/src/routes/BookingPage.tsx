// src/routes/BookingPage.tsx
import { useState } from "react";
import SessionBooking from "../components/SessionBooking";
import type { AvailableSlot } from "../types/data";

const therapists = [
  { id: "t1", name: "Dr. Amelia Tan" },
  { id: "t2", name: "Dr. Jason Lee" },
  { id: "t3", name: "Dr. Nur Aisha" },
];

const timeSlots = ["09:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"];

export default function BookingPage() {
  const [selectedTherapist, setSelectedTherapist] = useState("");
  const [slots, setSlots] = useState<AvailableSlot[]>([]);

  // When user selects a therapist — generate time slots
  const handleTherapistSelect = (id: string) => {
    setSelectedTherapist(id);

    const generatedSlots: AvailableSlot[] = timeSlots.flatMap((time, index) =>
      ["Video", "Phone", "Live Chat"].map((type, typeIndex) => ({
        id: index * 3 + typeIndex + 1,
        time,
        type: type as "Video" | "Phone" | "Live Chat",
        therapistId: id,
      }))
    );

    setSlots(generatedSlots);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Step 1: Pick Therapist */}
      <h2 className="text-2xl font-bold mb-4">Choose Therapist</h2>
      <select
        className="border px-3 py-2 rounded w-full mb-6"
        value={selectedTherapist}
        onChange={(e) => handleTherapistSelect(e.target.value)}
      >
        <option value="">Select therapist</option>
        {therapists.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      {/* Step 2: Session Booking */}
      {selectedTherapist && (
        <SessionBooking
          therapistId={selectedTherapist}
          initialSlots={slots}
        />
      )}
    </div>
  );
}
