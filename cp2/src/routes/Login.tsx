import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebaseClient";
import { doc, setDoc } from "firebase/firestore";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ------------------------
  // 🔹 Email Sign Up or Login
  // ------------------------
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // store user in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name: name || "Unnamed User",
          email,
          createdAt: new Date().toISOString(),
        });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const token = await userCredential.user.getIdToken();

      // Verify with backend
      await fetch("http://localhost:3000/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      navigate("/patient");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ------------------------
  // 🔹 Google Login
  // ------------------------
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      // store user in Firestore (if new)
      await setDoc(
        doc(db, "users", result.user.uid),
        {
          name: result.user.displayName || "Google User",
          email: result.user.email,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // verify with backend
      await fetch("http://localhost:3000/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      navigate("/patient");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ------------------------
  // 🔹 Forgot Password
  // ------------------------
  const handleForgotPassword = async () => {
    if (!email) return setError("Enter your email first.");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset link sent!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="my-20 max-w-md mx-auto bg-white p-8 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-700">
        {isRegister ? "Create an Account" : "Welcome Back"}
      </h2>

      <form onSubmit={handleAuth} className="space-y-4">
        {isRegister && (
          <label className="block">
            <span className="text-sm text-gray-600">Full Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Your name"
              required
            />
          </label>
        )}

        <label className="block">
          <span className="text-sm text-gray-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="example@email.com"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Enter your password"
            required
          />
        </label>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          {isRegister ? "Sign Up" : "Login"}
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
        >
          Continue with Google
        </button>

        {!isRegister && (
          <button
            type="button"
            onClick={handleForgotPassword}
            className="w-full text-indigo-600 text-sm mt-2"
          >
            Forgot password?
          </button>
        )}
      </form>

      <p className="text-center text-gray-600 text-sm mt-4">
        {isRegister ? "Already have an account?" : "Don’t have an account?"}{" "}
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="text-indigo-600 font-medium"
        >
          {isRegister ? "Login here" : "Register"}
        </button>
      </p>
    </div>
  );
}
