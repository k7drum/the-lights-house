"use client";
import React, { useState, useEffect, FormEvent } from "react";
import { auth, db } from "@/config/firebaseConfig";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showReset, setShowReset] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>("");
  const [resetSuccess, setResetSuccess] = useState<string>("");
  const router = useRouter();

  // Keep users logged in & redirect based on role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.data()?.role || "user";
        router.push(role === "admin" ? "/admin/dashboard" : "/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Handle login form submit
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.data()?.role || "user";
      router.push(role === "admin" ? "/admin/dashboard" : "/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    setError("");
    setResetSuccess("");

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess("Password reset email sent! Check your inbox.");
    } catch {
      setError("Error sending password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-96 rounded-lg bg-gray-800 p-6 shadow-md">
        <h2 className="mb-4 text-center text-2xl font-bold">
          {showReset ? "Reset Password" : "Login"}
        </h2>

        {error && <p className="mb-2 text-center text-red-500">{error}</p>}
        {resetSuccess && (
          <p className="mb-2 text-center text-green-500">{resetSuccess}</p>
        )}

        {showReset ? (
          // Password reset form
          <div>
            <label className="mb-2 block text-gray-400">Email Address</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              className="mb-4 w-full rounded bg-gray-700 p-2 text-white"
            />
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className="w-full rounded bg-blue-500 py-2 hover:bg-blue-600 transition"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <p
              className="mt-4 cursor-pointer text-center text-gray-400 hover:text-gray-300"
              onClick={() => {
                setShowReset(false);
                setError("");
                setResetSuccess("");
              }}
            >
              Back to Login
            </p>
          </div>
        ) : (
          // Login form
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded bg-gray-700 p-2 text-white"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded bg-gray-700 p-2 text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-red-600 py-2 hover:bg-red-700 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <p
              className="mt-4 cursor-pointer text-center text-gray-400 hover:text-gray-300"
              onClick={() => {
                setShowReset(true);
                setError("");
                setResetSuccess("");
              }}
            >
              Forgot Password?
            </p>
          </form>
        )}

        <p className="mt-4 text-center text-gray-400">
          Don't have an account?{" "}
          <a href="/auth/register" className="text-red-500 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
