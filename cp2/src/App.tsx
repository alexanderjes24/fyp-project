import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Auth from "./routes/Login";
import Home from "./routes/Home";
import CompleteProfile from "./routes/CompleteProfile";

// Simple reusable popup component
function Popup({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;

  return (
      <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-green-500 text-white px-6 py-3 rounded shadow-lg">
        {message}
        <button
          onClick={onClose}
          className="ml-4 text-white font-bold"
        >
          ×
        </button>
      </div>
    </div>


  );
}

function App() {
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (message: string) => {
    setPopupMessage(message);
    setTimeout(() => {
      setPopupMessage(""); // hide popup after 3 seconds
    }, 3000);
  };

  return (
    <>
      <Navbar />
      <Popup message={popupMessage} onClose={() => setPopupMessage("")} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth showPopup={showPopup} />} />
        <Route path="/complete-profile" element={<CompleteProfile showPopup={showPopup} />} />
      </Routes>
    </>
  );
}

export default App;
