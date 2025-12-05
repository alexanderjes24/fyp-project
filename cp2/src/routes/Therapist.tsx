// src/routes/AllTherapists.tsx
import { useEffect, useState } from "react";

interface TherapistCred {
  uid: string;
  name: string;
  university: string;
  license: string;
  dateOfLicense: string;
  approval: "pending" | "approved" | "rejected";
}

export default function AllTherapists() {
  const [therapists, setTherapists] = useState<TherapistCred[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        const res = await fetch("http://localhost:3000/therapist/all-therapists");
        const data = await res.json();
        setTherapists(data.therapists || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTherapists();
  }, []);

  if (loading) return <p className="text-center mt-20 text-gray-500">Loading therapists...</p>;

  if (therapists.length === 0)
    return (
      <p className="text-center mt-20 text-gray-500">
        No therapist credentials submitted yet.
      </p>
    );

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-indigo-700 mb-8 text-center">All Therapists</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {therapists.map((t) => (
          <div
            key={t.uid}
            className="bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between hover:shadow-2xl transition"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-indigo-700">{t.name}</h2>
              <p className="text-gray-600"><span className="font-semibold">University:</span> {t.university}</p>
              <p className="text-gray-600"><span className="font-semibold">License:</span> {t.license}</p>
              <p className="text-gray-600">
                <span className="font-semibold">Date of License:</span>{" "}
                {new Date(t.dateOfLicense).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  t.approval === "approved"
                    ? "bg-green-100 text-green-800"
                    : t.approval === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {t.approval.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
