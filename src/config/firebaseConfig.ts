// /src/config/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ Add this import

const firebaseConfig = {
    apiKey: "AIzaSyArR9vWZlZX-AeISUZWpXH1aNedl__asS4",
    authDomain: "thelightshouse-chat.firebaseapp.com",
    projectId: "thelightshouse-chat",
    storageBucket: "thelightshouse-chat.firebasestorage.app",
    messagingSenderId: "518005149419",
    appId: "1:518005149419:web:02a80b5569e45c4eebf8ae",
    measurementId: "G-NWC3MHKGT7"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ Make sure this is added

// Export the Firebase services
export { auth, db, storage };
