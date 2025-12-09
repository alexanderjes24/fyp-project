import { useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Add showPopup as a prop
interface CompleteProfileProps {
  showPopup: (message: string) => void;
}

export default function CompleteProfile({ showPopup }: CompleteProfileProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !age || !sex) {
      setError("All fields are required.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("User not logged in.");
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        age,
        sex,
      });

      // ✅ Show popup
      showPopup("✅ Profile completed successfully!");
      navigate("/profile");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="pt-20">
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-700">
        Complete Your Profile
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
          <span className="text-sm text-gray-600">Age</span>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1 block w-full border rounded-lg p-2"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-600">Sex</span>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="mt-1 block w-full border rounded-lg p-2"
            required
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </label>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Save & Continue
        </button>
      </form>
    </div>
    </div>
  );
}
