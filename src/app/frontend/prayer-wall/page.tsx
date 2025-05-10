"use client";

import { useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast"; 
import Link from "next/link";

export default function PrayerWallPage() {
  const [newPrayer, setNewPrayer] = useState({ name: "", request: "" });
  const [submitting, setSubmitting] = useState(false);

  const submitPrayer = async () => {
    if (!newPrayer.name.trim() || !newPrayer.request.trim()) {
      toast.error("Please fill in your name and prayer request.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "prayers"), {
        name: newPrayer.name,
        request: newPrayer.request,
        prayedFor: false,
        createdAt: serverTimestamp(),
      });
      setNewPrayer({ name: "", request: "" });
      toast.success("Prayer request submitted successfully!");
    } catch (error) {
      console.error("Error submitting prayer:", error);
      toast.error("Failed to submit prayer. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        
        {/* ✅ Page Heading */}
        <motion.h1 
          className="text-4xl font-bold mb-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Prayer Wall
        </motion.h1>

        {/* ✅ Form Section */}
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-semibold mb-4">Submit Your Prayer Request</h2>

          <input
            type="text"
            placeholder="Your Name"
            value={newPrayer.name}
            onChange={(e) => setNewPrayer({ ...newPrayer, name: e.target.value })}
            className="w-full p-3 rounded bg-gray-700 mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <textarea
            placeholder="Your Prayer Request"
            value={newPrayer.request}
            onChange={(e) => setNewPrayer({ ...newPrayer, request: e.target.value })}
            className="w-full p-3 rounded bg-gray-700 mb-4 h-32 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <button
            onClick={submitPrayer}
            disabled={submitting}
            className="w-full py-3 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-600 transition"
          >
            {submitting ? "Submitting..." : "Submit Prayer"}
          </button>
        </motion.div>
      </div>

      {/* ✅ Subscribe Section */}
      <motion.section
        className="py-16 bg-gray-800 mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Subscribe to Our Newsletter</h2>
          <p className="mb-8 text-gray-300">
            Stay updated with our latest news, events, and sermons. Enter your email below to subscribe.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full sm:w-auto px-4 py-3 bg-white border border-gray-300 rounded-l-lg text-black placeholder-gray-500 focus:outline-none"
            />
            <button
              className="mt-4 sm:mt-0 sm:ml-2 bg-yellow-500 text-black font-semibold px-6 py-3 rounded-r-lg hover:bg-yellow-600 transition duration-300"
            >
              Subscribe
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
