import { useState } from "react";
import type { AvailableSlot } from "../types/data";
import { getAuth } from "firebase/auth";
import { createBooking, createChatForBooking } from "../services/bookingService";

interface Props {
  therapistId: string;
  initialSlots: AvailableSlot[];
}

export default function SessionBooking({ therapistId, initialSlots }: Props) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedType, setSelectedType] = useState<"Video" | "Phone" | "Live Chat" | "">("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedType || !selectedSlot) {
      alert("Please select date, type and time.");
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to book.");
      return;
    }

    setLoading(true);
    try {
      const bookingId = await createBooking({
        userId: user.uid,
        therapistId,
        date: selectedDate,
        time: selectedSlot.time,
        type: selectedType,
      });

      // Optionally create chat doc
      await createChatForBooking(bookingId, user.uid, therapistId);

      alert("Booking created successfully!");
      // navigate to profile/dashboard or chat page if you have one
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to create booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Select Session Details</h2>

      <label className="font-semibold">Choose Date</label>
      <input
        type="date"
        className="border px-3 py-2 rounded w-full mb-4"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      <label className="font-semibold">Session Type</label>
      <select
        className="border px-3 py-2 rounded w-full mb-4"
        value={selectedType}
        onChange={(e) => {
          setSelectedType(e.target.value as any);
          setSelectedSlot(null);
        }}
      >
        <option value="">Select Type</option>
        <option value="Video">Video</option>
        <option value="Phone">Phone</option>
        <option value="Live Chat">Live Chat</option>
      </select>

      {selectedType !== "" && (
        <>
          <label className="font-semibold">Available Time Slots</label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {initialSlots
              .filter((slot) => slot.type === selectedType)
              .map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`p-3 border rounded-lg transition text-center ${
                    selectedSlot?.id === slot.id ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {slot.time}
                </button>
              ))}
          </div>
        </>
      )}

      <button
        onClick={handleConfirm}
        disabled={!selectedSlot || !selectedDate || !selectedType || loading}
        className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
      >
        {loading ? "Booking..." : "Confirm Booking"}
      </button>
    </div>
  );
}
