// src/config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyArR9vWZlZX-AeISUZWpXH1aNedl__asS4",
  authDomain: "thelightshouse-chat.firebaseapp.com",
  projectId: "thelightshouse-chat",
  storageBucket: "thelightshouse-chat.appspot.com",
  messagingSenderId: "518005149419",
  appId: "1:518005149419:web:02a80b5569e45c4eebf8ae",
  measurementId: "G-NWC3MHKGT7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
