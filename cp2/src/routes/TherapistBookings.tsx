// src/routes/TherapistBookings.tsx
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import type { Booking } from "../types/data";

export default function TherapistBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const therapistId = auth.currentUser?.uid;

  const load = async () => {
    if (!therapistId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/booking/therapist?therapistId=${therapistId}`);
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error loading bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // optionally set interval or realtime subscription
  }, [therapistId]);

  const updateStatus = async (bookingId: string, status: Booking["status"]) => {
    if (!therapistId) return;

    try {
      const res = await fetch("http://localhost:3000/booking/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, therapistId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!bookings.length) return <div>No bookings found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Bookings for you</h2>
      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="p-4 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{b.date} • {b.time}</div>
              <div className="text-sm text-gray-600">User: {b.userId} • {b.type}</div>
              <div className="text-sm text-gray-500">Status: {b.status}</div>
            </div>
            <div className="space-y-2">
              {b.status !== "confirmed" && b.status !== "cancelled" && (
                <button onClick={() => updateStatus(b.id, "confirmed")} className="px-3 py-1 bg-green-600 text-white rounded">Confirm</button>
              )}
              {b.status !== "completed" && b.status !== "cancelled" && (
                <button onClick={() => updateStatus(b.id, "completed")} className="px-3 py-1 bg-blue-600 text-white rounded">Mark Done</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
