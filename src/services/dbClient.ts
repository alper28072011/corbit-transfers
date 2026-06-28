import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAB-ikC0x3DquebC2uOk5Ib8Mry-reufU0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "corbit-transfers.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "corbit-transfers",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "corbit-transfers.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "569111586632",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:569111586632:web:f6a96b1f8c4fb3f3dff57d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
