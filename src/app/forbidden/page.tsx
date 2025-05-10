"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { Lock, Home, LogIn } from "lucide-react";

export default function ForbiddenPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center">
      <Lock size={64} className="text-red-500 mb-4" />
      <h1 className="text-3xl font-bold">403 - Forbidden</h1>
      <p className="text-gray-400 mt-2">
        You don’t have permission to access this page.
      </p>

      {!user ? (
        <p className="text-gray-400 mt-2">
          Please log in with an authorized account.
        </p>
      ) : (
        <p className="text-gray-400 mt-2">
          If you believe this is an error, contact an admin for assistance.
        </p>
      )}

      <div className="mt-6 space-x-4">
        <Link href="/">
          <button className="px-6 py-3 bg-blue-500 text-white rounded-lg flex items-center gap-2 hover:bg-blue-600">
            <Home size={20} /> Go Home
          </button>
        </Link>
        {!user && (
          <Link href="/auth/login">
            <button className="px-6 py-3 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600">
              <LogIn size={20} /> Login
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
