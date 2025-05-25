"use client";

import { useState, FormEvent, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { auth, db } from "@/config/firebaseConfig";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";

const LobbyChat = dynamic(
  () => import("@/components/lobby/LobbyChat"),
  { ssr: false }
);

export default function LobbyPage() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // join lobby: ensure anonymous auth first
  async function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a display name");
      return;
    }
    setError(null);
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error(err);
        setError("Could not sign in anonymously");
        return;
      }
    }
    setJoined(true);
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <motion.header
        className="py-20 bg-gray-800 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h1 className="text-5xl font-bold text-yellow-400">Join the Lobby</h1>
        <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
          This is our 24/7 community space—drop in anytime to connect, pray, or say hello!
        </p>
      </motion.header>

      <main className="flex-1 p-6">
        {joined && user ? (
          <motion.div
            className="h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <LobbyChat userName={name.trim()} roomId="lobby" />
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleJoin}
            className="max-w-md mx-auto bg-gray-800 p-8 rounded-xl shadow-xl space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-gray-300">
              What should we call you in the lobby?
            </p>
            <input
              type="text"
              placeholder="Your display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {error && <p className="text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            >
              Enter Lobby
            </button>
          </motion.form>
        )}
      </main>

      <motion.footer
        className="py-4 text-center text-gray-500 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        © {new Date().getFullYear()} The Light’s House
      </motion.footer>
    </div>
  );
}
