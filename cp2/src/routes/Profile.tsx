import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseClient";
import { useNavigate } from "react-router-dom";
import TherapistCredForm from "../components/TherapistCredForm";
import { ShieldCheck, User, Mail, Award, ExternalLink, RefreshCw } from "lucide-react";

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

  const navigate = useNavigate();
  const auth = getAuth();

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

      const checkRes = await fetch(
        `http://localhost:3000/therapist/check-credentials?uid=${uid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const checkData = await checkRes.json();

      if (checkData.hasCreds) {
        const credRes = await fetch(
          `http://localhost:3000/therapist/all-therapists?uid=${uid}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const credData = await credRes.json();
        therapistCredData = credData.credentials;
        setCred(therapistCredData);
      } else if (userData.role === "therapist") {
        setShowCredForm(true);
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
  }, [auth]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium tracking-wide">Securing Profile Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-25 px-4 sm:px-6 lg:px-8 relative">
      
      {showCredForm && (
        <TherapistCredForm 
          showPopup={showPopup} 
          onClose={() => {
            setShowCredForm(false);
            fetchProfile(); 
          }} 
        />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 h-32 w-full relative">
            <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-2xl shadow-md">
              <div className="w-24 h-24 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <User size={48} />
              </div>
            </div>
          </div>

          <div className="pt-16 pb-8 px-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{profile?.name || "Anonymous User"}</h1>
                <p className="text-slate-500 flex items-center gap-1 mt-1">
                  <Mail size={16} /> {profile?.email}
                </p>
              </div>
              <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                profile?.role === 'therapist' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {profile?.role}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Demographics</p>
                <p className="text-slate-700 font-medium">{profile?.age || "--"} Years • {profile?.sex || "Not Specified"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Status</p>
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  {profile?.role === "user" && cred ? (
                    <span className="flex items-center text-amber-600 animate-pulse text-sm">
                      ● Verification Pending
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-slate-600">Active Account</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => navigate("/complete-profile")}
                className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-all"
              >
                Edit Profile
              </button>
              
              {profile?.role === "user" && !cred && (
                <button
                  onClick={() => setShowCredForm(true)}
                  className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-all shadow-md shadow-green-200"
                >
                  Become a Therapist
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Credentials Card */}
        {cred && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Award size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Professional Credentials</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">University</p>
                <p className="text-slate-800 font-semibold">{cred.university}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">License ID</p>
                <p className="text-slate-800 font-mono font-semibold">{cred.license}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
              <span className="text-slate-600 font-medium">Internal Approval Status</span>
              <span className={`px-3 py-1 rounded-lg text-sm font-bold capitalize ${
                cred.approval === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {cred.approval}
              </span>
            </div>
          </div>
        )}

        {/* Blockchain Proof Card */}
        {cred && (blockchainCred || isVerifying) && (
          <div className={`rounded-3xl p-8 border transition-all duration-500 ${
            isVerifying 
              ? 'bg-white border-slate-200'
              : blockchainCred?.verified 
                ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-100' 
                : blockchainCred?.hash
                  ? 'bg-red-600 border-red-400 shadow-lg shadow-red-100' // DATA TAMPERED
                  : 'bg-white border-slate-200' // PENDING/SYNCING
          }`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isVerifying 
                    ? 'bg-slate-100 text-slate-600' 
                    : blockchainCred?.verified 
                      ? 'bg-blue-500 text-white' 
                      : blockchainCred?.hash
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                }`}>
                  <ShieldCheck size={24} />
                </div>
                <h2 className={`text-xl font-bold ${
                  isVerifying 
                    ? 'text-slate-900' 
                    : (blockchainCred?.verified || blockchainCred?.hash) 
                      ? 'text-white' 
                      : 'text-slate-900'
                }`}>
                  {isVerifying 
                    ? "Verifying Integrity..." 
                    : blockchainCred?.verified 
                      ? "Blockchain Verified" 
                      : blockchainCred?.hash 
                        ? "Data Integrity Alert!" 
                        : "Blockchain Status"}
                </h2>
              </div>
              {isVerifying && <RefreshCw className="animate-spin text-slate-400" size={20} />}
            </div>

            {isVerifying ? (
              <p className="text-slate-500 animate-pulse">Scanning immutable ledger for records...</p>
            ) : blockchainCred?.verified ? (
              <div className="space-y-4">
                <div className="bg-blue-700/30 rounded-2xl p-4 backdrop-blur-sm border border-blue-400/30">
                  <p className="text-xs text-blue-200 uppercase font-bold mb-2">Canonical Hash</p>
                  <p className="text-white font-mono text-xs break-all leading-relaxed">
                    {blockchainCred.hash}
                  </p>
                </div>
                
                <div className="flex justify-between text-sm text-blue-100 font-medium">
                  <span>Timestamp: {new Date(blockchainCred.timestamp || 0).toLocaleDateString()}</span>
                  <span>Tx: {cred.txHash?.substring(0, 8)}...</span>
                </div>

                <button
                  onClick={() => window.open(`http://localhost:8545/tx/${cred.txHash}`, "_blank")}
                  className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={18} />
                  View Transaction Receipt
                </button>
              </div>
            ) : blockchainCred?.hash ? (
              /* TAMPERED STATE */
              <div className="space-y-4">
                <div className="bg-red-700/30 rounded-2xl p-4 backdrop-blur-sm border border-red-400/30">
                  <p className="text-xs text-red-200 uppercase font-bold mb-2">Original Chain Record</p>
                  <p className="text-white font-mono text-xs break-all leading-relaxed opacity-80">
                    {blockchainCred.hash}
                  </p>
                </div>
                
                <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                  <p className="text-white font-semibold mb-1">Security Alert</p>
                  <p className="text-red-100 text-sm leading-relaxed">
                    The current database values do not match the fingerprint stored on the blockchain. 
                    This record may have been tampered with.
                  </p>
                </div>
              </div>
            ) : (
              /* PENDING STATE */
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-amber-800 font-semibold mb-1 flex items-center gap-2">
                  <span>⚠️</span> Sync Pending
                </p>
                <p className="text-amber-700/80 text-sm leading-relaxed">
                  The local blockchain node does not currently hold a record for this UID. 
                  Ensure the node is active and data has been minted.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}