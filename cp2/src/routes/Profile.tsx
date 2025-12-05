// src/routes/Profile.tsx
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseClient";
import { useNavigate } from "react-router-dom";
import TherapistCredForm from "../components/TherapistCredForm";

interface ProfileProps {
  showPopup: (msg: string) => void; // pass from App
}

export default function Profile({ showPopup }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [cred, setCred] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCredForm, setShowCredForm] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch user profile from Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        navigate("/complete-profile");
        return;
      }

      const userData = userSnap.data();
      setProfile(userData);

      // If therapist, fetch credentials from backend
      if (userData.role === "therapist") {
        try {
          const token = await user.getIdToken();

          // Check if credentials exist
          const checkRes = await fetch(
            `http://localhost:3000/therapist/check-credentials?uid=${user.uid}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const checkData = await checkRes.json();

          if (!checkData.hasCreds) {
            setShowCredForm(true); // Show form if no credentials
          } else {
            // Fetch full credentials details
            const credRes = await fetch(
              `http://localhost:3000/therapist/all?uid=${user.uid}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const credData = await credRes.json();
            setCred(credData.credentials);
          }
        } catch (err) {
          console.error("Failed to fetch therapist credentials:", err);
        }
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  // If therapist and no credentials, show form
  if (showCredForm) {
    return <TherapistCredForm showPopup={showPopup} />;
  }

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 pt-32 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-4">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-center">
          My Profile
        </h1>

        <div className="space-y-2 text-gray-700">
          <p><strong>Name:</strong> {profile?.name || "Not set"}</p>
          <p><strong>Age:</strong> {profile?.age || "Not set"}</p>
          <p><strong>Sex:</strong> {profile?.sex || "Not set"}</p>
          <p><strong>Email:</strong> {profile?.email}</p>
          <p><strong>Role:</strong> {profile?.role}</p>
        </div>

        {/* Show therapist credentials if available */}
        {cred && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h2 className="font-semibold text-lg">Therapist Credentials</h2>
            <p><strong>Name:</strong> {cred.name}</p>
            <p><strong>University:</strong> {cred.university}</p>
            <p><strong>License Number:</strong> {cred.license}</p>
            <p><strong>Date of License:</strong> {cred.dateOfLicense}</p>
            <p><strong>Status:</strong> {cred.approval}</p>
          </div>
        )}

        <button
          onClick={() => navigate("/complete-profile")}
          className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}
