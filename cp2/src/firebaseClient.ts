import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBzceftibYE2_X3l3yX0uNyHz-6_9Qz12k",
    authDomain: "fyp-therapymind.firebaseapp.com",
    projectId: "fyp-therapymind",
    storageBucket: "fyp-therapymind.firebasestorage.app",
    messagingSenderId: "123020231037",
    appId: "1:123020231037:web:941a6d1de107040edd4c14",
    measurementId: "G-4VY9SYCEZ8"
    };

// ✅ Initialize app
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ✅ Initialize Firestore
export const db = getFirestore(app);

googleProvider.setCustomParameters({
  prompt: "select_account"
});