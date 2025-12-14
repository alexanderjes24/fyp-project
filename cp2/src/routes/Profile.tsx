// src/routes/Profile.tsx
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseClient";
import { useNavigate } from "react-router-dom";
import TherapistCredForm from "../components/TherapistCredForm";

interface BlockchainCred {
  verified: boolean;
  hash?: string;
  timestamp?: number;
  error?: boolean;
}

interface ProfileProps {
  showPopup: (msg: string) => void;
}

export default function Profile({ showPopup }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [cred, setCred] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCredForm, setShowCredForm] = useState(false);
  const [blockchainCred, setBlockchainCred] = useState<BlockchainCred | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRequestingRole, setIsRequestingRole] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();

  const refetchProfile = () => {
    setLoading(true);
    window.location.reload();
  };

  const requestTherapistRole = async () => {
    if (!auth.currentUser || isRequestingRole) return;

    setIsRequestingRole(true);
    const token = await auth.currentUser.getIdToken();

    try {
      const res = await fetch("http://localhost:3000/auth/request-therapist-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ uid: auth.currentUser.uid }),
      });

      const data = await res.json();

      if (res.ok) {
        showPopup("Successfully requested Therapist role. An admin will review your request shortly.");
        refetchProfile();
      } else {
        showPopup(data.error || "Failed to submit role request.");
      }

    } catch (err) {
      console.error("Role request failed:", err);
      showPopup("Network error during role request.");
    } finally {
      setIsRequestingRole(false);
    }
  };

  const fetchProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    const uid = user.uid;
    const token = await user.getIdToken();
    let userData: any;
    let therapistCredData: any = null;

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        navigate("/complete-profile");
        return;
      }

      userData = userSnap.data();
      setProfile(userData);

      if (userData.role === "therapist") {
        const checkRes = await fetch(
          `http://localhost:3000/therapist/check-credentials?uid=${uid}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const checkData = await checkRes.json();

        if (!checkData.hasCreds) {
          setShowCredForm(true);
        } else {
          const credRes = await fetch(
            `http://localhost:3000/therapist/all-therapists?uid=${uid}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const credData = await credRes.json();
          therapistCredData = credData.credentials;
          setCred(therapistCredData);
        }
      }

      if (therapistCredData && therapistCredData.approval === "approved") {
        setIsVerifying(true);
        try {
          const verifyRes = await fetch(
            `http://localhost:3000/therapist/verify-cred/${uid}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const verifyData: BlockchainCred = await verifyRes.json();
          setBlockchainCred(verifyData);
        } catch (err) {
          console.error("Blockchain verification failed:", err);
          setBlockchainCred({ verified: false, error: true });
        } finally {
          setIsVerifying(false);
        }
      }

    } catch (err) {
      console.error("Failed to fetch data:", err);
      showPopup("Error fetching data. Check server connection.");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [auth, navigate, showPopup]);

  if (loading)
    return <p className="text-center mt-20 text-gray-600">Loading profile and credential status...</p>;

  if (showCredForm) {
    return <TherapistCredForm showPopup={showPopup} />;
  }

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 pt-20 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-4">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-center">My Profile</h1>
        <hr />

        <div className="space-y-2 text-gray-700">
          <p><strong>Name:</strong> {profile?.name || "Not set"}</p>
          <p><strong>Age:</strong> {profile?.age || "Not set"}</p>
          <p><strong>Sex:</strong> {profile?.sex || "Not set"}</p>
          <p><strong>Email:</strong> {profile?.email}</p>
          <p>
            <strong>Role:</strong>
            <span className="font-semibold capitalize">{profile?.role}</span>
            {profile?.roleRequest === "pending" && (
              <span className="ml-2 text-orange-500 font-medium">(Request Pending)</span>
            )}
          </p>
        </div>

        <hr />

        {profile?.role === "user" && profile?.roleRequest !== "pending" && (
          <button
            onClick={requestTherapistRole}
            disabled={isRequestingRole}
            className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isRequestingRole ? "Submitting Request..." : "Request to be a Therapist"}
          </button>
        )}

        {cred && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h2 className="font-semibold text-lg text-indigo-600">Credential Submission Details</h2>
            <p><strong>Status:</strong> <span className="capitalize font-medium">{cred.approval}</span></p>
            <p><strong>University:</strong> {cred.university}</p>
            <p><strong>License Number:</strong> {cred.license}</p>
          </div>
        )}

        {cred && (blockchainCred || isVerifying) && (
          <div className="mt-4 p-4 border rounded bg-blue-50">
            <h2 className="font-semibold text-lg text-blue-700">Blockchain Proof Status</h2>

            {isVerifying ? (
              <p className="text-blue-700 mt-2">
                <span className="animate-pulse">...</span> Verifying canonical data on local blockchain...
              </p>
            ) : blockchainCred?.verified ? (
              <div className="mt-2">
                <p className="text-green-700 font-semibold">✅ Verified: The data exists on the immutable ledger.</p>

                <p className="text-sm mt-2">
                  <strong>Canonical Hash:</strong>
                  <br />
                  <span className="font-mono break-all text-green-800">{blockchainCred.hash}</span>
                </p>

                <p className="text-sm">
                  <strong>Stored On:</strong> {new Date(blockchainCred.timestamp || 0).toLocaleString()}
                </p>

                <hr className="my-2" />

                <p className="text-xs text-gray-600">
                  **Receipt ID (TxHash):** <span className="font-mono break-all">{cred.txHash}</span>
                  <br />(This ID is the transaction that created the record.)
                </p>

                <button
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  onClick={() => window.open(`http://localhost:8545/tx/${cred.txHash}`, "_blank")}
                >
                  Verify on Blockchain
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-yellow-700 font-semibold">⚠️ Not Found on Live Chain</p>
                <p className="text-sm text-gray-600">
                  The contract returned an empty record. Please ensure your Hardhat node is running or that an admin has
                  approved the credentials since the last chain reset.
                </p>
                {blockchainCred?.error && (
                  <p className="text-red-600 text-xs mt-1">Connection Error to verification service.</p>
                )}
              </div>
            )}
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
