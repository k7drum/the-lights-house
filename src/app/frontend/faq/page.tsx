"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const faqs = [
  {
    question: "💡 What is The Light's House Digital Church? Who is it for?",
    answer: `The Light's House Online is a virtual church community designed for individuals who:
- Desire a deeper relationship with Jesus Christ
- Are not able to attend a physical church community
- Want to grow through solid Bible teaching and authentic fellowship
- Live anywhere in the world and want to stay connected to God’s Word
- Value spiritual leadership from Pastor Davies Bamigboye`,
  },
  {
    question: "🕒 When are your online services?",
    answer: `Our services are held exclusively online via Zoom:
- Sunday Worship Service — 8:30 AM (WAT)
- Wednesday Bible Hangout — 6:00 PM (WAT)
Access links and reminders can be found on our website: thelightshouse.org`,
  },
  {
    question: "🖥️ What can I expect during a typical service?",
    answer: `Each service includes:
- Uplifting worship and praise
- Deep, Scripture-based teaching by Pastor Davies
- Community engagement through chat, prayer, or breakout rooms
- Opportunities for giving, testimony sharing, and spiritual encouragement`,
  },
  {
    question: "❓ Is The Light’s House Church a physical church?",
    answer: `We are currently an online-first church. All our services, prayer meetings, and Bible hangouts happen digitally—making it easy for you to join no matter where you live.`,
  },
  {
    question: "🙏 Can I give my tithes or offerings?",
    answer: `Yes! Giving to The Light's House Church is safe and easy. You can give online by visiting thelightshouse.org/give`,
  },
  {
    question: "🔄 How do I adjust or manage my giving?",
    answer: `Once logged into your giving account, you can update or manage recurring donations through your “My Account” dashboard. For help, visit thelightshouse.org/contact`,
  },
  {
    question: "🌍 I don’t live in Nigeria. Can I still be part of the community?",
    answer: `Absolutely. Whether you're in Nigeria, the US, the UK, or anywhere else—our heart is to welcome and disciple believers globally.`,
  },
  {
    question: "🙌 How can I get connected?",
    answer: `Check out the Get Connected section on our website to join:
- A small group
- Our prayer wall
- Volunteer teams
- Special events and fellowships
Visit: thelightshouse.org/get-connected`,
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    country: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "faqQuestions"), {
        ...formData,
        createdAt: Timestamp.now(),
      });
      setFormData({
        title: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        country: "",
        message: "",
      });
      setSuccess(true);
    } catch (error) {
      console.error("Error submitting FAQ:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-12 bg-black text-white">
      <motion.h1
        className="text-4xl font-bold text-center mb-12"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Frequently Asked Questions
      </motion.h1>

      {/* FAQ List */}
      <div className="max-w-4xl mx-auto space-y-6">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            className="bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <h3 className="text-lg font-semibold">{faq.question}</h3>
            {openIndex === index && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-gray-300 whitespace-pre-line"
              >
                {faq.answer}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ✅ Question Form */}
      <div className="mt-16 max-w-4xl mx-auto bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Still have a question?</h2>
        <p className="text-gray-400 text-center mb-6">
          Fill the form below and we’ll get back to you.
        </p>

        {success && (
          <div className="mb-4 p-3 bg-green-600 text-white text-center rounded">
            ✅ Your question has been submitted successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "title", placeholder: "Title" },
            { name: "firstName", placeholder: "First Name" },
            { name: "lastName", placeholder: "Last Name" },
            { name: "email", placeholder: "Email", type: "email" },
            { name: "phone", placeholder: "Phone", type: "tel" },
            { name: "city", placeholder: "City" },
            { name: "state", placeholder: "State" },
            { name: "country", placeholder: "Country" },
          ].map(({ name, placeholder, type = "text" }) => (
            <input
              key={name}
              type={type}
              placeholder={placeholder}
              value={formData[name as keyof typeof formData]}
              onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
              className="p-2 bg-gray-800 rounded"
              required
            />
          ))}

          <textarea
            placeholder="Message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="p-2 bg-gray-800 rounded md:col-span-2"
            rows={5}
            required
          ></textarea>

          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg md:col-span-2 hover:bg-yellow-600 transition"
          >
            {loading ? "Submitting..." : "Submit Question"}
          </button>
        </form>
      </div>
    </div>
  );
}
