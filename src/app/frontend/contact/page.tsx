"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Facebook, Youtube, Instagram } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Network error");
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* ─── CONTACT FORM + INFO ────────────────────────────── */}
      <motion.div
        className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 p-6 pt-20"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } },
        }}
      >
        {/* Contact Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="bg-gray-800 p-8 rounded-lg shadow-lg"
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: { opacity: 1, x: 0 },
          }}
        >
          <h1 className="text-3xl font-bold mb-6 text-center">Get in Touch</h1>

          {status === "success" && <p className="text-green-400 text-center mb-4">Message sent!</p>}
          {status === "error" && <p className="text-red-400 text-center mb-4">Something went wrong.</p>}

          {["name", "email", "subject"].map((field) => (
            <label key={field} className="block mb-4">
              <span className="text-gray-300 capitalize">{field}</span>
              <input
                name={field}
                type={field === "email" ? "email" : "text"}
                value={(form as any)[field]}
                onChange={handleChange}
                required
                className="mt-1 block w-full bg-gray-700 text-white rounded py-2 px-3"
              />
            </label>
          ))}

          <label className="block mb-6">
            <span className="text-gray-300">Message</span>
            <textarea
              name="message"
              rows={5}
              value={form.message}
              onChange={handleChange}
              required
              className="mt-1 block w-full bg-gray-700 text-white rounded py-2 px-3"
            />
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full py-3 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-600 transition"
          >
            {status === "sending" ? "Sending…" : "Send Message"}
          </button>
        </motion.form>

        {/* Contact Info */}
        <motion.div
          className="bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col justify-between"
          variants={{
            hidden: { opacity: 0, x: 20 },
            visible: { opacity: 1, x: 0 },
          }}
        >
          <div>
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <p className="text-gray-300 mb-6">
              We’d love to hear from you! Whether you have questions or just want to connect.
            </p>

            <div className="space-y-4 text-gray-300">
              <div className="flex items-center"><Mail className="mr-3" /> info@lightshouse.org</div>
              <div className="flex items-center"><Phone className="mr-3" /> +1 (234) 567‑890</div>
              <div className="flex items-center"><MapPin className="mr-3" />
                <address className="not-italic">
                  123 Faith Avenue<br />Hope City, TX 75001
                </address>
              </div>
            </div>
          </div>

          {/* Social Icons */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2">Follow Us</h3>
            <div className="flex space-x-4 text-gray-300">
              <Link href="https://facebook.com"><Facebook className="hover:text-white" size={24} /></Link>
              <Link href="https://youtube.com"><Youtube className="hover:text-white" size={24} /></Link>
              <Link href="https://instagram.com"><Instagram className="hover:text-white" size={24} /></Link>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── SUBSCRIBE SECTION ───────────────────────────── */}
      <motion.section
        className="py-16 bg-gray-800 mt-24 px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Subscribe to Our Newsletter</h2>
          <p className="mb-8 text-gray-300">
            Stay updated with our latest news, events, and sermons.
          </p>
          <div className="flex flex-col sm:flex-row justify-center">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full sm:w-auto px-4 py-3 bg-white text-black placeholder-gray-500 rounded-l-lg border-none"
            />
            <button className="mt-4 sm:mt-0 sm:ml-2 bg-yellow-500 text-black font-semibold px-6 py-3 rounded-r-lg hover:bg-yellow-600 transition duration-300">
              Subscribe
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
