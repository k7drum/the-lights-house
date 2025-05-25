"use client";

import React, { useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type FormData = {
  donorName: string;
  email: string;
  amount: string;
  date: string;
  method: string;
  type: string;
  recurring: boolean;
};

export default function GivePage() {
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const { donorName, amount, date, method, type } = formData;
    if (!donorName || !amount || !date || !method || !type) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "donations"), {
        ...formData,
        createdAt: new Date(),
      });

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-black text-white">
      <div className="flex-grow flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-xl rounded-lg bg-gray-800 p-8 shadow-md"
        >
          <h1 className="mb-6 text-center text-3xl font-bold">
            Give Online
          </h1>
          {errorMsg && (
            <p className="mb-4 text-center text-red-400">{errorMsg}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm">Donor Name *</label>
              <input
                name="donorName"
                type="text"
                value={formData.donorName}
                onChange={handleChange}
                required
                className="w-full rounded bg-gray-700 p-3 text-white"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm">Email (optional)</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded bg-gray-700 p-3 text-white"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm">Amount *</label>
                <input
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="w-full rounded bg-gray-700 p-3 text-white"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm">Date *</label>
                <input
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full rounded bg-gray-700 p-3 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm">Giving Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full rounded bg-gray-700 p-3 text-white"
              >
                <option value="">Select Giving Type</option>
                <option value="Tithe">Tithe</option>
                <option value="Offering">Offering</option>
                <option value="Special Donation">Special Donation</option>
                <option value="Charity">Charity</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-sm">
                Payment Method *
              </label>
              <select
                name="method"
                value={formData.method}
                onChange={handleChange}
                required
                className="w-full rounded bg-gray-700 p-3 text-white"
              >
                <option value="">Select Method</option>
                <option value="Stripe">Stripe</option>
                <option value="Flutterwave">Flutterwave</option>
                <option value="PayPal">PayPal</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                name="recurring"
                type="checkbox"
                checked={formData.recurring}
                onChange={handleChange}
                className="form-checkbox h-5 w-5 text-yellow-500"
              />
              <label className="text-sm text-gray-300">
                Make this a monthly recurring gift
              </label>
            </div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full rounded-lg bg-yellow-500 py-3 font-bold text-black transition-all hover:bg-yellow-600"
            >
              {loading ? "Processing..." : "Give Now"}
            </motion.button>
          </form>
        </motion.div>
      </div>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
              className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow-lg"
            >
              <h2 className="mb-4 text-2xl font-bold">Thank You!</h2>
              <p className="mb-6">
                Your donation has been received successfully.
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="rounded bg-yellow-500 py-2 px-6 font-bold text-black hover:bg-yellow-600"
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
