import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User } from "firebase/auth"; // ✅ type-only import


const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  // ✅ Track login status with Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Logout function
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null); // Immediately update state
    navigate("/"); // Redirect after logout
  };

  // ✅ Active link styling
  const getNavLinkClass = (path: string) =>
    location.pathname === path
      ? "font-semibold border-b-2 border-black pb-1"
      : "text-gray-600 hover:text-black";

  return (
    <>
      {/* Mobile Navigation */}
      <div className="md:hidden flex justify-around bg-white shadow-lg py-3 fixed bottom-0 w-full z-50">
        <Link to="/" className={getNavLinkClass("/")}>
          Home
        </Link>
        <Link to="/about" className={getNavLinkClass("/about")}>
          About
        </Link>
        <Link to="/counter" className={getNavLinkClass("/counter")}>
          counter
        </Link>
        <Link to="/blockchain" className={getNavLinkClass("/blockchain")}>
            blockchain
          </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex justify-between items-center w-full bg-white shadow-lg p-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="font-bold text-3xl">
            THERAPYMIND
          </Link>
        </div>

        {/* Nav Links */}
        <div className="flex items-center space-x-6">
          <Link to="/" className={getNavLinkClass("/")}>
            Home
          </Link>
          <Link to="/about" className={getNavLinkClass("/about")}>
            About
          </Link>
          <Link to="/services" className={getNavLinkClass("/services")}>
            Services
          </Link>
          <Link to="/blockchain" className={getNavLinkClass("/blockchain")}>
            blockchain
          </Link>

          {/* ✅ Login / Logout Button */}
          {!user && (
            <Link
              to="/login"
              className="border border-black rounded-md px-4 py-1 hover:bg-black hover:text-white transition"
            >
              Sign Up
            </Link>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="border border-red-600 text-red-600 rounded-md px-4 py-1 hover:bg-red-600 hover:text-white transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default NavBar;
