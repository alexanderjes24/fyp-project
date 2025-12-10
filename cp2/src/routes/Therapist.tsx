// src/routes/AllTherapists.tsx
import { useEffect, useState } from "react";
import React from "react"; 

interface TherapistCred {
  uid: string;
  name: string;
  university: string;
  license: string;
  dateOfLicense: string;
  approval: "pending" | "approved" | "rejected";
}

// Placeholder function for demonstration (Actual logic would be on the backend)
const handleApproval = (uid: string, action: "approve" | "reject") => {
  console.log(`Therapist ${uid} action: ${action}`);
};


export default function AllTherapists() {
  const [therapists, setTherapists] = useState<TherapistCred[]>([]);
  const [loading, setLoading] = useState(true);
  // State to manage the selected therapist for detail view
  const [selectedTherapist, setSelectedTherapist] = useState<TherapistCred | null>(null);

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

  return (
    <div className="min-h-screen w-full p-6 bg-gray-50">
      
      {/* KEY CHANGE 1: Reduced Max-Width to max-w-3xl for a pronounced central column effect */}
      <div className="max-w-3xl mx-auto"> 
        <h1 className="text-3xl font-bold text-indigo-600 mb-10 text-center">
          Therapist Credential Review
        </h1>

        {therapists.length === 0 && (
          <p className="text-center mt-10 text-gray-500">
            No therapist credentials submitted yet.
          </p>
        )}

        {/* KEY CHANGE 2: Simplified Grid. Removed XL and LG columns to keep content stacked/centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"> 
          {therapists.map((t) => (
            <div
              key={t.uid}
              onClick={() => setSelectedTherapist(t)}
              className="bg-white rounded-xl shadow-md p-6 flex flex-col justify-between 
                         hover:shadow-lg transition cursor-pointer border border-gray-200"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-indigo-600">{t.name}</h2>
                <p className="text-gray-600">
                  <span className="font-medium">University:</span> {t.university}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">License:</span> {t.license}
                </p>
              </div>
              <div className="mt-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    t.approval === "approved"
                      ? "bg-green-100 text-green-700"
                      : t.approval === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {t.approval.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Detail View / Modal (No change needed here as it's already centered) */}
      {selectedTherapist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all">
            
            {/* Profile Header */}
            <div className="text-center pb-6 border-b border-gray-200 mb-6">
                <div className="w-20 h-20 bg-indigo-100 rounded-full mx-auto mb-3 flex items-center justify-center text-indigo-600 font-bold text-xl">
                    {selectedTherapist.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                    {selectedTherapist.name}
                </h2>
                <p className="text-sm text-gray-500">
                    Therapist Credential Details
                </p>
            </div>

            {/* Credential Details - Organized as a Profile Box */}
            <div className="space-y-4 mb-8">
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">University</span>
                <span className="text-gray-900">{selectedTherapist.university}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">License ID</span>
                <span className="text-gray-900">{selectedTherapist.license}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-semibold text-gray-700">Date of License</span>
                <span className="text-gray-900">
                  {new Date(selectedTherapist.dateOfLicense).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold text-gray-700">Current Status</span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    selectedTherapist.approval === "approved"
                      ? "bg-green-100 text-green-700"
                      : selectedTherapist.approval === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedTherapist.approval.toUpperCase()}
                </span>
              </div>

              <div className="border border-dashed border-indigo-300 p-4 mt-6 rounded-lg bg-indigo-50 text-center">
                <p className="text-indigo-600 font-medium">
                    View Attached Documents for Full Verification
                </p>
              </div>
            </div>

            {/* Action Buttons (Only Close) */}
            <div className="flex justify-end items-center pt-4 border-t">
              <button
                onClick={() => setSelectedTherapist(null)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}