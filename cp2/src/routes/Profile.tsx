// src/routes/Profile.tsx
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseClient";
import { useNavigate } from "react-router-dom";
import TherapistCredForm from "../components/TherapistCredForm";

// Define the shape of the data retrieved from the blockchain
interface BlockchainCred {
  verified: boolean;
  hash?: string;
  timestamp?: number; // In milliseconds (from backend conversion)
  error?: boolean;
}

interface ProfileProps {
  showPopup: (msg: string) => void; // pass from App
}

export default function Profile({ showPopup }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [cred, setCred] = useState<any>(null); // Firebase credentials metadata (includes txHash)
  const [loading, setLoading] = useState(true);
  const [showCredForm, setShowCredForm] = useState(false);
  
  // NEW STATE: Holds the canonical data fetched from the blockchain via Fastify
  const [blockchainCred, setBlockchainCred] = useState<BlockchainCred | null>(null); 
  const [isVerifying, setIsVerifying] = useState(false); 

  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login");
        return;
      }

      const uid = user.uid;
      const token = await user.getIdToken();
      let userData: any;
      let therapistCredData: any = null; // Holds Firebase cred data if it exists

      try {
        // --- 1. Fetch user profile from Firestore ---
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          navigate("/complete-profile");
          return;
        }

        userData = userSnap.data();
        setProfile(userData);

        // --- 2. If therapist, fetch credentials metadata from backend ---
        if (userData.role === "therapist") {
          // Check if credentials exist (using existing route)
          const checkRes = await fetch(
            `http://localhost:3000/therapist/check-credentials?uid=${uid}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const checkData = await checkRes.json();

          if (!checkData.hasCreds) {
            setShowCredForm(true); 
          } else {
            // Fetch full credentials details (metadata from Firebase)
            const credRes = await fetch(
              `http://localhost:3000/therapist/all-therapists?uid=${uid}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const credData = await credRes.json();
            therapistCredData = credData.credentials;
            setCred(therapistCredData);
          }
        }

        // --- 3. Canonical Blockchain Verification (IF credential metadata exists) ---
        if (therapistCredData && therapistCredData.approval === "approved") {
          setIsVerifying(true);
          try {
            // Call the NEW Fastify route to verify the data on the blockchain
            const verifyRes = await fetch(
              `http://localhost:3000/therapist/verify-cred/${uid}`, // Route must be implemented in Fastify
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const verifyData: BlockchainCred = await verifyRes.json();
            
            // Set the state with the canonical blockchain result
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

    fetchProfile();
  }, [auth, navigate, showPopup]); 

  if (loading) return <p className="text-center mt-20 text-gray-600">Loading profile and credential status...</p>;

  // If therapist and no credentials, show form
  if (showCredForm) {
    return <TherapistCredForm showPopup={showPopup} />;
  }

  // --- Rendering Logic ---
  return (
    <div className="min-h-screen flex justify-center bg-gray-50 pt-32 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-4">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6 text-center">
          My Profile
        </h1>
        <hr/>

        {/* User Profile Details */}
        <div className="space-y-2 text-gray-700">
          <p><strong>Name:</strong> {profile?.name || "Not set"}</p>
          <p><strong>Age:</strong> {profile?.age || "Not set"}</p>
          <p><strong>Sex:</strong> {profile?.sex || "Not set"}</p>
          <p><strong>Email:</strong> {profile?.email}</p>
          <p><strong>Role:</strong> <span className="font-semibold capitalize">{profile?.role}</span></p>
        </div>
        <hr/>

        {/* Therapist Credentials Metadata (from Firebase) */}
        {cred && (
          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h2 className="font-semibold text-lg text-indigo-600">Credential Submission Details</h2>
            <p><strong>Status:</strong> <span className="capitalize font-medium">{cred.approval}</span></p>
            <p><strong>University:</strong> {cred.university}</p>
            <p><strong>License Number:</strong> {cred.license}</p>
          </div>
        )}

        {/* Blockchain Credential Status (USES BLOCKCHAIN DATA FOR PROOF) */}
        {cred && (blockchainCred || isVerifying) && (
          <div className="mt-4 p-4 border rounded bg-blue-50">
            <h2 className="font-semibold text-lg text-blue-700">Blockchain Proof Status</h2>
            
            {isVerifying ? (
                <p className="text-blue-700 mt-2">
                    <span className="animate-pulse">...</span> Verifying canonical data on local blockchain...
                </p>
            ) : blockchainCred?.verified ? (
                // ✅ SUCCESS: Data retrieved directly from the contract state
                <div className="mt-2">
                    <p className="text-green-700 font-semibold">
                        ✅ Verified: The data exists on the immutable ledger.
                    </p>

                    <p className="text-sm mt-2">
                        <strong>Canonical Hash:</strong>
                        <br />
                        <span className="font-mono break-all text-green-800">{blockchainCred.hash}</span>
                    </p>
                    <p className="text-sm">
                        <strong>Stored On:</strong> {new Date(blockchainCred.timestamp || 0).toLocaleString()}
                    </p>
                    
                     <hr className="my-2"/>
                    <p className="text-xs text-gray-600">
                        **Receipt ID (TxHash):** <span className="font-mono break-all">{cred.txHash}</span> 
                        <br/>(This ID is the transaction that created the record.)
                    </p>
                    
                     <button
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        onClick={() =>
                          window.open(`http://localhost:8545/tx/${cred.txHash}`, "_blank")
                        }
                      >
                        Verify on Blockchain
                      </button>
                </div>
            ) : (
                // ⚠️ FAILURE: The contract returned null (chain wiped or error)
                <div className="mt-2">
                    <p className="text-yellow-700 font-semibold">
                        ⚠️ Not Found on Live Chain
                    </p>
                    <p className="text-sm text-gray-600">
                        The contract returned an empty record. Please ensure your **Hardhat node is running** or that an admin has approved the credentials since the last chain reset.
                    </p>
                    {blockchainCred?.error && <p className="text-red-600 text-xs mt-1">Connection Error to verification service.</p>}
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