// src/app/frontend/new-here/page.tsx
"use client";

import { useState, useRef, FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function NewHerePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    heardFrom: "",
    firstVisit: "",
    prayer: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const sitekey = process.env.NEXT_PUBLIC_RECAPTCHA_SITEKEY || "";

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    let token = "";
    if (sitekey && recaptchaRef.current) {
      token = await recaptchaRef.current.executeAsync();
      recaptchaRef.current.reset();
      if (!token) {
        setError("CAPTCHA failed. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    try {
      await addDoc(collection(db, "newVisitors"), {
        ...form,
        createdAt: serverTimestamp(),
        captcha: token,
      });
      await fetch("/api/sendWelcomeEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, name: form.name }),
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-6">
        <motion.div
          className="bg-gray-800 p-8 rounded-xl shadow-xl max-w-md text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
            Thank You!
          </h2>
          <p className="mb-6">
            We’ll be in touch soon. Check your email for a welcome message and
            calendar invite.
          </p>
          <Link href="/">
            <button className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400">
              Back to Home
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Hero */}
      <motion.section
        className="py-24 bg-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h1 className="text-5xl font-bold text-yellow-400">
            Welcome to The Light’s House
          </h1>
          <p className="text-xl text-gray-300">
            We’re so glad you’re here! Please tell us about yourself.
          </p>
        </div>
      </motion.section>

      {/* Form */}
      <motion.section
        className="py-16"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-3xl mx-auto bg-gray-800 p-8 rounded-xl shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <p className="text-red-500" role="alert">
                {error}
              </p>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block mb-1 font-medium">
                Full Name*
              </label>
              <input
                id="name"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Email & Phone */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block mb-1 font-medium">
                  Email Address*
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block mb-1 font-medium">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>

            {/* Heard From */}
            <div>
              <label htmlFor="heardFrom" className="block mb-1 font-medium">
                How did you hear about us?
              </label>
              <select
                id="heardFrom"
                name="heardFrom"
                value={form.heardFrom}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="">Choose one…</option>
                <option>Friend or family</option>
                <option>Social media</option>
                <option>Website</option>
                <option>Event</option>
                <option>Other</option>
              </select>
            </div>

            {/* First Visit */}
            <div>
              <label htmlFor="firstVisit" className="block mb-1 font-medium">
                Date of First Visit
              </label>
              <input
                id="firstVisit"
                name="firstVisit"
                type="date"
                value={form.firstVisit}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* Prayer */}
            <div>
              <label htmlFor="prayer" className="block mb-1 font-medium">
                Prayer Request (optional)
              </label>
              <textarea
                id="prayer"
                name="prayer"
                rows={4}
                value={form.prayer}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            {/* ReCAPTCHA */}
            {sitekey ? (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={sitekey}
                size="invisible"
              />
            ) : (
              <p className="text-yellow-400 text-sm mb-4">
                ⚠️ ReCAPTCHA key missing. Set{" "}
                <code>NEXT_PUBLIC_RECAPTCHA_SITEKEY</code>.
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </form>
        </div>
      </motion.section>

      {/* Calendar & Map */}
      <motion.section
        className="py-12 bg-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-6 px-6">
          <h3 className="text-2xl font-bold text-white">Our Location</h3>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019545993123!2d-122.41941508468176!3d37.77492977975945!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085818b5f8f6f0ac!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1695645112345!5m2!1sen!2sus"
            width="100%"
            height="300"
            className="rounded-lg border-0"
            loading="lazy"
            aria-label="Church location map"
          />
        </div>
      </motion.section>

      {/* Next Steps */}
      <motion.section
        className="py-12 bg-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 px-6">
          {/* Download Brochure */}
          <a
            href="/brochure.pdf"
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-start p-6 bg-gray-700 hover:bg-gray-600 rounded-xl shadow-lg transition space-y-2"
          >
            <h4 className="text-xl font-semibold text-yellow-400">
              Download Brochure
            </h4>
            <p className="text-gray-300">
              Learn more about our vision & ministries.
            </p>
          </a>

          {/* Prayer Wall */}
          <Link href="/frontend/prayer-wall">
            <div
              className="flex flex-col items-start p-6 bg-gray-700 hover:bg-gray-600 rounded-xl shadow-lg transition space-y-2 cursor-pointer"
              role="link"
            >
              <h4 className="text-xl font-semibold text-yellow-400">
                Prayer Wall
              </h4>
              <p className="text-gray-300">
                Share a prayer request with our community.
              </p>
            </div>
          </Link>

          {/* Give Online */}
          <Link href="/frontend/giving">
            <div
              className="flex flex-col items-start p-6 bg-gray-700 hover:bg-gray-600 rounded-xl shadow-lg transition space-y-2 cursor-pointer"
              role="link"
            >
              <h4 className="text-xl font-semibold text-yellow-400">
                Give Online
              </h4>
              <p className="text-gray-300">Support our church’s mission.</p>
            </div>
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
