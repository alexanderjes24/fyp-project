import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebaseClient";
import { doc, setDoc, getDoc, query, collection, where, getDocs } from "firebase/firestore";

interface AuthProps {
  showPopup: (message: string) => void;
}

export default function Auth({ showPopup }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      let userCredential;

      if (isRegister) {
        // Pre-check Firestore for duplicate email
        const q = query(collection(db, "users"), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setError("Email is already registered. Please login instead.");
          return;
        }

        // Create Firebase Auth user
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Create minimal Firestore user doc (profile completion later)
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email,
          role: "user",
          createdAt: new Date().toISOString(),
        });

        showPopup("✅ Account created! Complete your profile next.");
        navigate("/complete-profile"); // redirect to complete profile
        return;
      } else {
        // Login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        showPopup("✅ Login successful!");
      }

      const token = await userCredential.user.getIdToken();

      await fetch("http://localhost:3000/auth/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      navigate("/");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already registered. Please login instead.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Try again.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Minimal Firestore doc for new Google users
        await setDoc(userRef, {
          email: result.user.email,
          role: "user", 
          createdAt: new Date().toISOString(),
        });
      }

      // Force complete profile if missing info
      const profile = (await getDoc(userRef)).data();
      if (!profile?.name || !profile?.age || !profile?.sex) {
        return navigate("/complete-profile");
      }

      await fetch("http://localhost:3000/auth/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      showPopup("✅ Login successful!");
      navigate("/");
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in popup closed. Try again.");
      } else {
        setError(err.message);
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return setError("Enter your email first.");
    try {
      await sendPasswordResetEmail(auth, email);
      showPopup("✅ Password reset link sent!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-700">
          {isRegister ? "Create an Account" : "Welcome Back"}
        </h2>

        <form onSubmit={handleAuth} className="space-y-4">
          <label className="block">
            <span className="text-sm text-gray-600">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border rounded-lg p-2"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border rounded-lg p-2"
              required
            />
          </label>

          {error && <p className="text-red-500 text-sm">{error}</p>}

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
    </div>
  );
}
