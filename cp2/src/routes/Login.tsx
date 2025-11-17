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

// Add showPopup as a prop
interface AuthProps {
  showPopup: (message: string) => void;
}

export default function Auth({ showPopup }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
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
        // ✅ Validate fields
        if (!name.trim() || !age.trim() || !sex.trim()) {
          setError("Please fill in all fields.");
          return;
        }

        // ✅ Pre-check Firestore for duplicate email
        const q = query(collection(db, "users"), where("email", "==", email));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setError("Email is already registered. Please login instead.");
          return;
        }

        // ✅ Create Firebase Auth user
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // ✅ Store user profile in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          name,
          age,
          sex,
          email,
          createdAt: new Date().toISOString(),
        });

        showPopup("✅ Account created successfully!");
      } else {
        // 🔹 Login
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        showPopup("✅ Login successful!");
      }

      // ✅ Get Firebase ID token
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

  // ------------------------
  // 🔹 Google Login + force profile completion
  // ------------------------
  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      // ✅ Check Firestore only to create new document if user doesn't exist
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // ✅ Create Firestore user document for new Google users
        await setDoc(userRef, {
          name: result.user.displayName || "",
          age: "",
          sex: "",
          email: result.user.email,
          createdAt: new Date().toISOString(),
        });
      }

      // ✅ Force complete profile if missing info
      const profile = (await getDoc(userRef)).data();
      if (!profile?.name || !profile?.age || !profile?.sex) {
        return navigate("/complete-profile");
      }

      // ✅ Verify token with backend
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

  // ------------------------
  // 🔹 Forgot Password
  // ------------------------
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
    <div className="my-20 max-w-md mx-auto bg-white p-8 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-700">
        {isRegister ? "Create an Account" : "Welcome Back"}
      </h2>

      <form onSubmit={handleAuth} className="space-y-4">
        {isRegister && (
          <>
            <label className="block">
              <span className="text-sm text-gray-600">Full Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border rounded-lg p-2"
                placeholder="Your name"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Age</span>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 block w-full border rounded-lg p-2"
                placeholder="Your age"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-600">Sex</span>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="mt-1 block w-full border rounded-lg p-2"
                required
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </>
        )}

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
  );
}
