import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getTherapistBookings, updateBookingStatus } from "../services/bookingService";
import type { Booking } from "../types/data";

export default function TherapistDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const auth = getAuth();

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const list = await getTherapistBookings(user.uid);
      setBookings(list);
    };
    load();
  }, [auth.currentUser]);

  const changeStatus = async (id: string, status: Booking["status"]) => {
    try {
      const user = auth.currentUser!;
      await updateBookingStatus(id, user.uid, status);
      setBookings((s) => s.map(b => b.id === id ? { ...b, status } : b));
    } catch (err: any) {
      alert(err.message || "Failed to update");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Bookings for you</h2>
      <div className="space-y-4">
        {bookings.map(b => (
          <div key={b.id} className="p-4 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{b.date} • {b.time}</div>
              <div className="text-sm text-gray-600">User: {b.userId} • {b.type}</div>
              <div className="text-sm text-gray-500">Status: {b.status}</div>
            </div>
            <div className="space-y-2">
              {b.status !== "confirmed" && b.status !== "cancelled" && (
                <button onClick={() => changeStatus(b.id, "confirmed")} className="px-3 py-1 bg-green-600 text-white rounded">Confirm</button>
              )}
              {b.status !== "completed" && b.status !== "cancelled" && (
                <button onClick={() => changeStatus(b.id, "completed")} className="px-3 py-1 bg-blue-600 text-white rounded">Mark Done</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
