import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseClient";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;

      if (!user) {
        navigate("/login");
        return;
      }

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setProfile(snap.data());
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) return <p className="text-center mt-20">Loading...</p>;

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 pt-32 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-center">
          My Profile
        </h1>

        <div className="space-y-4 text-gray-700">
          <p><strong>Name:</strong> {profile?.name || "Not set"}</p>
          <p><strong>Age:</strong> {profile?.age || "Not set"}</p>
          <p><strong>Sex:</strong> {profile?.sex || "Not set"}</p>
          <p><strong>Email:</strong> {profile?.email}</p>
        </div>

        <button
          onClick={() => navigate("/complete-profile")}
          className="mt-8 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}
