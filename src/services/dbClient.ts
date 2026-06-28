import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// VITE_DB_URL (databaseURL / authDomain) ve VITE_DB_ANON_KEY (apiKey) .env'den okunur ve Firebase adapter eşleştirmesi yapılır
const rawDbUrl = import.meta.env.VITE_DB_URL || "";
const rawAnonKey = import.meta.env.VITE_DB_ANON_KEY || "";

let authDomainValue = "corbit-transfers.firebaseapp.com";
if (rawDbUrl && rawDbUrl.startsWith("http")) {
  try {
    authDomainValue = new URL(rawDbUrl).hostname;
  } catch (e) {
    // Fallback if URL parsing fails
  }
}

const firebaseConfig = {
  apiKey: rawAnonKey || "AIzaSyAB-ikC0x3DquebC2uOk5Ib8Mry-reufU0",
  authDomain: authDomainValue,
  databaseURL: rawDbUrl || "https://corbit-transfers.firebaseio.com",
  projectId: "corbit-transfers",
  storageBucket: "corbit-transfers.firebasestorage.app",
  messagingSenderId: "569111586632",
  appId: "1:569111586632:web:f6a96b1f8c4fb3f3dff57d"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export Firestore database client
export const db = getFirestore(app);

