// cp2(frontend)/components/Navbar.tsx
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();

          const res = await fetch("http://localhost:3000/auth/get-user", {
            method: "POST", // <- make sure this is POST
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }), // <- backend expects token in body
          });

          const data = await res.json();
          if (res.ok && data.role) {
            setRole(data.role);
          } else {
            console.error("Failed to fetch role:", data);
            setRole("user");
          }
        } catch (err) {
          console.error("Error fetching role:", err);
          setRole("user");
        }
      } else {
        setRole("user");
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

  return (
    <>
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

      {/* Mobile Navbar */}
      <div className="md:hidden flex justify-around bg-white shadow-lg py-3 fixed bottom-0 w-full z-40">
        {!user && (
          <>
            <Link to="/about" className={isActive("/about")}>About</Link>
            <Link to="/services" className={isActive("/services")}>Services</Link>
            <Link to="/blockchain" className={isActive("/blockchain")}>Blockchain</Link>
            <Link to="/login" className="text-indigo-600 font-medium">Login</Link>
          </>
        )}

        {user && role === "admin" && (
          <>
            <Link to="/admin" className={isActive("/admin")}>AdminPanel</Link>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="border border-red-600 text-red-600 rounded-md px-3 py-1 hover:bg-red-600 hover:text-white transition"
            >
              Logout
            </button>
          </>
        )}

        {user && role !== "admin" && (
          <>
            <Link to="/" className={isActive("/")}>Home</Link>
            <Link to="/book-session" className={isActive("/book-session")}>Book Session</Link>
            <Link to="/assignment" className={isActive("/assignment")}>Assignment</Link>
            <Link to="/profile" className="text-indigo-600 font-medium hover:text-indigo-800">Profile</Link>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="border border-red-600 text-red-600 rounded-md px-3 py-1 hover:bg-red-600 hover:text-white transition"
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Desktop Navbar */}
      <div className="hidden md:flex justify-between items-center w-full fixed bg-white/80 backdrop-blur-lg shadow-md p-4 z-40">
        <div className="flex items-center space-x-2">
          {user && role === "admin" ? (
            <Link to="/admin" className="font-bold text-3xl hover:text-gray-600 hover:scale-101">AdminPanel</Link>
          ) : (
            <Link to="/" className="font-bold text-3xl hover:text-gray-600 hover:scale-101">THERAPYMIND</Link>
          )}
        </div>

        <div className="flex items-center space-x-6">
          {!user && (
            <>
              <Link to="/about" className={isActive("/about")}>About</Link>
              <Link to="/services" className={isActive("/services")}>Services</Link>
              <Link to="/blockchain" className={isActive("/blockchain")}>Blockchain</Link>
              <Link to="/login" className="border border-black rounded-md px-4 py-1 hover:bg-black hover:text-white transition">Login</Link>
            </>
          )}

          {user && role === "admin" && (
            <>
              <Link to="/admin" className={isActive("/admin")}>AdminPanel</Link>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="border border-red-600 text-red-600 rounded-md px-4 py-1 hover:bg-red-600 hover:text-white transition"
              >
                Logout
              </button>
            </>
          )}

          {user && role !== "admin" && (
            <>
              <Link to="/" className={isActive("/")}>Home</Link>
              <Link to="/book-session" className={isActive("/book-session")}>Book Session</Link>
              <Link to="/assignment" className={isActive("/assignment")}>Assignment</Link>
              <Link to="/profile" className="text-indigo-600 font-medium hover:text-indigo-800">Profile</Link>
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
