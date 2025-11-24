// src/App.tsx
import React, { useState } from "react";
import type { ReactNode } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Profile from "./routes/Profile";
import Auth from "./routes/Login";
import Home from "./routes/Home";
import CompleteProfile from "./routes/CompleteProfile";
import BlockchainPage from "./routes/Counter";
import ConsentPage from "./routes/Consent";
import QuizPage from "./components/PreRegistrationQuiz";
import AboutPage from "./routes/About";
import BookingPage from "./routes/BookingPage";

import { getAuth, signOut } from "firebase/auth";
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

// ------------------ Logout Confirmation Modal ------------------
function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
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

// ------------------ ProtectedRoute Wrapper ------------------
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  return user ? children : <Navigate to="/login" replace />;
};

// ------------------ App Component ------------------
function App() {
  const [popupMessage, setPopupMessage] = useState("");
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const showPopup = (message: string) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 3000);
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    setLogoutConfirm(false);
    navigate("/login");
  };

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
        <Route
          path="/quiz"
          element={
            <QuizPage
              onQuizComplete={async (answers) => {
                const auth = getAuth();
                const user = auth.currentUser;

                if (!user) {
                  showPopup("You must be logged in to save quiz answers.");
                  navigate("/login");
                  return;
                }

                await saveQuizAnswers(user.uid, answers);
                showPopup("Quiz completed and saved!");
                navigate("/complete-profile");
              }}
            />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute>
              <CompleteProfile showPopup={showPopup} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/blockchain"
          element={
            <ProtectedRoute>
              <ConsentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/book-session"
          element={
            <ProtectedRoute>
              <BookingPage/>
            </ProtectedRoute>
          }
        />
        {/* Catch-all → Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
