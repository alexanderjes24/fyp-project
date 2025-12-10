import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

interface NavBarProps {
  setLogoutConfirm: React.Dispatch<React.SetStateAction<boolean>>;
}

const NavBar = ({ setLogoutConfirm }: NavBarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<"user" | "therapist" | "admin">("user");
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const res = await fetch("http://localhost:3000/auth/get-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const data = await res.json();
          setRole(res.ok && data.role ? data.role : "user");

          if (data.name && data.email) {
            setUserInfo({ name: data.name, email: data.email });
          }
        } catch (err) {
          console.error("Error fetching role:", err);
          setRole("user");
        }
      } else {
        setRole("user");
        setUserInfo(null);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setShowLogoutConfirm(false);
    navigate("/login");
  };

  const isActive = (path: string) =>
    location.pathname === path
      ? "font-semibold border-b-2 border-black pb-1"
      : "text-gray-600 hover:text-black";

  // Determine home path dynamically
  const homePath =
    !user
      ? "/"
      : role === "admin"
      ? "/admin/dashboard"
      : role === "therapist"
      ? "/dashboard"
      : "/my-bookings";

  return (
    <>
      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80 text-center">
            <p className="mb-4 font-semibold text-gray-800">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-between space-x-4">
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-gray-400 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <div className="hidden md:flex justify-between items-center w-full fixed bg-white/80 backdrop-blur-lg shadow-md p-4 z-40">
        <Link to={homePath} className="font-bold text-3xl hover:text-gray-600 hover:scale-101">
          THERAPYMIND
        </Link>

        <div className="flex items-center space-x-6">
          {!user && (
            <>
              <Link to={homePath} className={isActive(homePath)}>Home</Link>
              <Link to="/about" className={isActive("/about")}>About</Link>
              <Link to="/services" className={isActive("/services")}>Services</Link>
              <Link to="/therapist" className={isActive("/therapist")}>Therapist</Link>
              <Link
                to="/login"
                className="border border-black rounded-md px-4 py-1 hover:bg-black hover:text-white transition"
              >
                Login
              </Link>
            </>
          )}

          {user && role === "admin" && (
            <>
              <Link to="/admin/dashboard" className={isActive("/admin/dashboard")}>Admin Dashboard</Link>
              <Link to="/profile" className={isActive("/profile")}>Profile</Link>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="border border-red-600 text-red-600 rounded-md px-4 py-1 hover:bg-red-600 hover:text-white transition"
              >
                Logout
              </button>
            </>
          )}

          {user && role === "therapist" && (
            <>
              <Link to="/dashboard" className={isActive("/dashboard")}>Dashboard</Link>
              <Link to="/profile" className={isActive("/profile")}>Profile</Link>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="border border-red-600 text-red-600 rounded-md px-4 py-1 hover:bg-red-600 hover:text-white transition"
              >
                Logout
              </button>
            </>
          )}

          {user && role === "user" && (
            <>
              <Link to="/my-bookings" className={isActive("/my-bookings")}>My Bookings</Link>
              <Link to="/book-session" className={isActive("/book-session")}>Book Session</Link>
              <Link to="/assignment" className={isActive("/assignment")}>Assignment</Link>
              <Link to="/therapist" className={isActive("/therapist")}>Therapist</Link>
              <Link to="/profile" className={isActive("/profile")}>Profile</Link>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="border border-red-600 text-red-600 rounded-md px-4 py-1 hover:bg-red-600 hover:text-white transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NavBar;
