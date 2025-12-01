import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { Booking } from "../types/data";

export default function UserBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setBookings([]);
        setLoading(false);
        return;
      }

      try {
        // Only call the API when we have a valid user ID
        const res = await fetch(`http://localhost:3000/booking?userId=${user.uid}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch bookings");
        }

        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (err: any) {
        console.error(err);
        alert(err.message || "Error fetching bookings");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCancel = async (bookingId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    try {
      const res = await fetch("http://localhost:3000/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, userId: user.uid }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking");

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to cancel booking");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading bookings...</div>;
  if (!bookings.length) return <div className="p-6 text-center">No bookings found.</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Bookings</h2>
      <div className="space-y-4">
        {bookings.map((b) => (
          <div key={b.id} className="p-4 bg-white rounded shadow">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{b.date} • {b.time}</div>
                <div className="text-sm text-gray-600">{b.type} • Therapist: {b.therapistName}</div>
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
