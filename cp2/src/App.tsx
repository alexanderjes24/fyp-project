// src/App.tsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import type { ReactNode } from "react";

import Navbar from "./components/Navbar";
import Profile from "./routes/Profile";
import Auth from "./routes/Login";
import Home from "./routes/Home";
import CompleteProfile from "./routes/CompleteProfile";
import ConsentPage from "./routes/Consent";
import QuizPage from "./components/PreRegistrationQuiz";
import AboutPage from "./routes/About";
import BookingPage from "./routes/BookingPage";
import UserBookings from "./routes/UserBookings";
import AdminPanel from "./routes/AdminPanel";
import AssignmentsPage from "./routes/UserAssignments";
import AdminDashboard from "./routes/AdminDashboard";
import TherapistDashboard from "./routes/TherapistDashboard";
import TherapistPage from "./routes/Therapist"
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { saveQuizAnswers } from "./services/quizService";

// ------------------ Popup Component ------------------
function Popup({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-green-500 text-white px-6 py-3 rounded shadow-lg flex items-center justify-between">
        {message}
        <button onClick={onClose} className="ml-4 font-bold">×</button>
      </div>
    </div>
  );
}

// ------------------ Logout Modal ------------------
function LogoutModal({ onConfirm, onCancel }: any) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-80 text-center shadow-lg">
        <p className="mb-4 text-gray-700">Are you sure you want to logout?</p>
        <div className="flex justify-around">
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------ ProtectedRoute ------------------
const ProtectedRoute = ({ user, children }: { user: any; children: ReactNode }) => {
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// ------------------ App Component ------------------
function App() {
  const [popupMessage, setPopupMessage] = useState("");
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"user" | "therapist" | "admin">("user");
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false); // one-time redirect flag

  const navigate = useNavigate();

  // ------------------ Firebase Auth Listener ------------------
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const res = await fetch("http://localhost:3000/auth/get-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          const data = await res.json();
          const fetchedRole = res.ok && data.role ? data.role : "user";
          setRole(fetchedRole);
          if (data.name && data.email) setUserInfo({ name: data.name, email: data.email });
        } catch (err) {
          console.error("Error fetching user info:", err);
        }
      }
    });

    return unsubscribe;
  }, []);

  // ------------------ One-time role-based redirect after login ------------------
  useEffect(() => {
    if (!authLoading && user && !hasRedirected) {
      if (role === "therapist") {
        navigate("/dashboard", { replace: true });
        setHasRedirected(true);
      } else if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
        setHasRedirected(true);
      }
      // Normal users: no auto-redirect
    }
  }, [authLoading, user, role, navigate, hasRedirected]);

  // ------------------ Popup ------------------
  const showPopup = (message: string) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 3000);
  };

  // ------------------ Logout ------------------
  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setLogoutConfirm(false);
    navigate("/login");
  };

  if (authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-lg">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Navbar setLogoutConfirm={setLogoutConfirm} />
      <Popup message={popupMessage} onClose={() => setPopupMessage("")} />
      {logoutConfirm && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setLogoutConfirm(false)}
        />
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<Auth showPopup={showPopup} />} />
        <Route path="/all-therapist" element={<TherapistPage />} />
        {/* Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <Profile showPopup={showPopup} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute user={user && role === "user" ? user : null}>
              <UserBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-session"
          element={
            <ProtectedRoute user={user && role === "user" ? user : null}>
              <BookingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute user={user}>
              <CompleteProfile showPopup={showPopup} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/all-therapist"
          element={
            <ProtectedRoute user={user}>
              <TherapistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignment"
          element={
            <ProtectedRoute user={user && role === "user" ? user : null}>
              <AssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <QuizPage
              onQuizComplete={async (answers) => {
                const auth = getAuth();
                const currentUser = auth.currentUser;
                if (!currentUser) {
                  showPopup("You must be logged in to save quiz answers.");
                  navigate("/login");
                  return;
                }
                await saveQuizAnswers(currentUser.uid, answers);
                showPopup("Quiz completed and saved!");
                navigate("/complete-profile");
              }}
            />
          }
        />

        {/* Therapist Dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute user={user && role === "therapist" ? user : null}>
              <TherapistDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute user={user && role === "admin" ? user : null}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user && role === "admin" ? user : null}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* 404 → Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
