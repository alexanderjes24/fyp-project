// src/routes/TherapistCredForm.tsx
import { useState, useEffect } from "react";
import { auth } from "../firebaseClient";
import { useNavigate } from "react-router-dom";

interface TherapistCredFormProps {
  showPopup: (msg: string) => void;
}

export default function TherapistCredForm({ showPopup }: TherapistCredFormProps) {
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [license, setLicense] = useState("");
  const [dateOfLicense, setDateOfLicense] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkExistingCreds = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const res = await fetch(`http://localhost:3000/therapist/check-credentials?uid=${user.uid}`);
        const data = await res.json();
        if (data.hasCreds) navigate("/therapist-dashboard"); // already has creds
      } catch (err) {
        console.error(err);
      }
    };
    checkExistingCreds();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !university || !license || !dateOfLicense) {
      setError("All fields are required.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("User not logged in.");
      return;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch("http://localhost:3000/therapist/submit-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ uid: user.uid, name, university, license, dateOfLicense })
      });

      const data = await res.json();
      if (data.success) {
        showPopup("Credentials submitted! Awaiting admin approval.");
        navigate("/therapist-dashboard");
      } else {
        setError(data.error || "Failed to submit credentials.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="my-20 max-w-md mx-auto bg-white p-8 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-700">
        Submit Your Therapist Credentials
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-gray-600">Full Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border rounded-lg p-2"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-600">University</span>
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="mt-1 block w-full border rounded-lg p-2"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-600">License Number</span>
          <input
            type="text"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            className="mt-1 block w-full border rounded-lg p-2"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-600">Date of License</span>
          <input
            type="date"
            value={dateOfLicense}
            onChange={(e) => setDateOfLicense(e.target.value)}
            className="mt-1 block w-full border rounded-lg p-2"
            required
          />
        </label>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Submit Credentials
        </button>
      </form>
    </div>
  );
}
