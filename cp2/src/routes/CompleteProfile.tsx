// src/routes/CompleteProfile.tsx
import { useState } from "react";
import { auth, db } from "../firebaseClient";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

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

      showPopup("✅ Profile completed successfully!");
      navigate("/profile");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    /** * BACKDROP: Matches the Medical Record Modal in UserDashboard
     * bg-black bg-opacity-50 + backdrop-blur
     */
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      
      {/* MODAL CONTAINER: Matches Dashboard's rounded-lg shadow-2xl */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* HEADER: Consistent with Dashboard Modal Headers */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900">Complete Your Profile</h3>
          <p className="text-sm text-gray-500 mt-1">Please provide your details to continue.</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>

            {/* Grid for Age and Sex */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 ml-1">Age</label>
                <input
                  type="number"
                  placeholder="Years"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 ml-1">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  required
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Error Message: Matches Dashboard Status style */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            {/* BUTTONS: Matches 'Book Your First Appointment' from Dashboard */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                Save & Continue
              </button>
            </div>
          </form>
        </div>

        {/* FOOTER: Aesthetic flair consistent with Dashboard card spacing */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
           <p className="text-xs text-gray-400">Your data is stored securely on the blockchain.</p>
        </div>
      </div>
    </div>
  );
}