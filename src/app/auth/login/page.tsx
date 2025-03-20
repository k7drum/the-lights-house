"use client";
import { useState, useEffect } from "react";
import { auth, db } from "@/config/firebaseConfig";
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false); // Toggle for password reset
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const router = useRouter();

  // ✅ Keep Users Logged In & Redirect Based on Role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.data()?.role || "user";
        role === "admin" ? router.push("/admin/dashboard") : router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ✅ Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ Fetch User Role
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.data()?.role || "user";

      // ✅ Redirect Based on Role
      router.push(role === "admin" ? "/admin/dashboard" : "/");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Password Reset
  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setResetSuccess("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess("Password reset email sent! Check your inbox.");
    } catch (error) {
      setError("Error sending password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen justify-center items-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center mb-4">{showReset ? "Reset Password" : "Login"}</h2>
        
        {error && <p className="text-red-500 text-center">{error}</p>}
        {resetSuccess && <p className="text-green-500 text-center">{resetSuccess}</p>}

        {showReset ? (
          // ✅ Password Reset Form
          <div>
            <label className="block text-gray-400 mb-2">Enter your email</label>
            <input 
              type="email" 
              value={resetEmail} 
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded mb-4" 
              required 
            />
            <button 
              onClick={handlePasswordReset} 
              className="w-full bg-blue-500 py-2 rounded hover:bg-blue-600 transition"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <p className="text-center text-gray-400 mt-4 cursor-pointer hover:text-gray-300" onClick={() => setShowReset(false)}>
              Back to Login
            </p>
          </div>
        ) : (
          // ✅ Login Form
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-400">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded" 
                required 
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-400">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded" 
                required 
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-red-600 py-2 rounded hover:bg-red-700 transition"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="text-center text-gray-400 mt-4 cursor-pointer hover:text-gray-300" onClick={() => setShowReset(true)}>
              Forgot Password?
            </p>
          </form>
        )}

        <p className="text-center text-gray-400 mt-4">
          Don't have an account? <a href="/auth/register" className="text-red-500">Sign up</a>
        </p>
      </div>
    </div>
  );
}
