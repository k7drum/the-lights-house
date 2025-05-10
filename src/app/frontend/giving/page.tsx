"use client";

import { useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function GivePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    donorName: "",
    email: "",
    amount: "",
    date: "",
    method: "",
    type: "",
    recurring: false,
  });

  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.donorName || !formData.amount || !formData.date || !formData.method || !formData.type) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "donations"), formData);

      setLoading(false);
      setShowSuccessModal(true);
      setFormData({
        donorName: "",
        email: "",
        amount: "",
        date: "",
        method: "",
        type: "",
        recurring: false,
      });

      setTimeout(() => {
        router.push("/frontend/giving/success");
      }, 3000);

    } catch (error) {
      console.error("Error saving donation:", error);
      setErrorMsg("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-black text-white">
      {/* Main Giving Form Section */}
      <div className="flex-grow flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-gray-800 rounded-lg shadow-md p-8 max-w-xl w-full"
        >
          <h1 className="text-3xl font-bold mb-6 text-center">Give Online</h1>

          {errorMsg && (
            <p className="text-red-400 mb-4 text-center">{errorMsg}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Donor Name */}
            <div>
              <label className="block text-sm mb-1">Donor Name *</label>
              <input
                type="text"
                name="donorName"
                value={formData.donorName}
                onChange={handleChange}
                className="p-3 bg-gray-700 rounded w-full"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm mb-1">Email (optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="p-3 bg-gray-700 rounded w-full"
              />
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="p-3 bg-gray-700 rounded w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="p-3 bg-gray-700 rounded w-full"
                  required
                />
              </div>
            </div>

            {/* Giving Type */}
            <div>
              <label className="block text-sm mb-1">Giving Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="p-3 bg-gray-700 rounded w-full"
                required
              >
                <option value="">Select Giving Type</option>
                <option value="Tithe">Tithe</option>
                <option value="Offering">Offering</option>
                <option value="Special Donation">Special Donation</option>
                <option value="Charity">Charity</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm mb-1">Payment Method *</label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                className="p-3 bg-gray-700 rounded w-full"
                required
              >
                <option value="">Select Method</option>
                <option value="Stripe">Stripe</option>
                <option value="Flutterwave">Flutterwave</option>
                <option value="PayPal">PayPal</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>

            {/* Recurring Giving */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="recurring"
                checked={formData.recurring}
                onChange={handleChange}
                className="form-checkbox text-yellow-500"
              />
              <label className="text-sm text-gray-300">Make this a monthly recurring gift</label>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-lg mt-6 transition-all"
            >
              {loading ? "Processing..." : "Give Now"}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="bg-white text-black p-8 rounded-lg shadow-lg max-w-sm w-full text-center"
            >
              <h2 className="text-2xl font-bold mb-4">Thank You!</h2>
              <p className="mb-6">Your donation has been received successfully.</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
