import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getUserBookings, cancelBooking } from "../services/bookingService";
import type { Booking } from "../types/data";

export default function UserBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const list = await getUserBookings(user.uid);
      setBookings(list);
      setLoading(false);
    };
    load();
  }, [auth.currentUser]);

  const handleCancel = async (bookingId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await cancelBooking(bookingId, user.uid);
      setBookings((s) => s.map(b => b.id === bookingId ? { ...b, status: "cancelled" } : b));
    } catch (err: any) {
      alert(err.message || "Failed to cancel");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!bookings.length) return <div>No bookings found.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
      <div className="space-y-4">
        {bookings.map(b => (
          <div key={b.id} className="p-4 bg-white rounded shadow">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{b.date} • {b.time}</div>
                <div className="text-sm text-gray-600">{b.type} • Therapist: {b.therapistId}</div>
                <div className="text-sm text-gray-500">Status: {b.status}</div>
              </div>
              <div className="space-y-2">
                {b.status !== "cancelled" && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
