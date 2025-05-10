"use client";
import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal"; // ✅ Optional: Create a reusable modal component
import emailjs from "@emailjs/browser"; // ✅ Install via npm if not installed

export default function HomecellRequestPage() {
  const [homecells, setHomecells] = useState([]);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    age: "",
    faithJourney: "",
    homecell: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchHomecells();
  }, []);

  const fetchHomecells = async () => {
    try {
      const snapshot = await getDocs(collection(db, "homecells"));
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHomecells(list);
    } catch (error) {
      console.error("Error fetching homecells:", error);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user) return alert("You must be logged in to request a homecell.");

    try {
      setSubmitting(true);
      await addDoc(collection(db, "pendingHomecellRequests"), {
        ...form,
        userId: user.uid,
        email: user.email,
        status: "pending",
        submittedAt: new Date(),
      });

      // ✅ Optional: Send email notification via EmailJS (configure ENV vars)
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          user_name: form.fullName,
          user_email: user.email,
          phone: form.phone,
          homecell: form.homecell,
          message: form.faithJourney,
        },
        process.env.NEXT_PUBLIC_EMAILJS_USER_ID!
      );

      setShowModal(true); // ✅ Show thank-you modal
      setForm({
        fullName: "",
        phone: "",
        age: "",
        faithJourney: "",
        homecell: "",
      });
    } catch (error) {
      console.error("Error submitting request:", error);
      alert("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-center text-gray-400">Checking authentication...</p>;
  if (!user) return <p className="text-center text-red-500">Please log in to access this page.</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">Join a Homecell Group</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-gray-800 p-4 rounded-lg shadow-md">
        <input
          type="text"
          placeholder="Full Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded"
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded"
          required
        />
        <input
          type="number"
          placeholder="Age"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded"
        />
        <textarea
          placeholder="Briefly describe your faith journey or spiritual needs"
          value={form.faithJourney}
          onChange={(e) => setForm({ ...form, faithJourney: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded"
        />
        <select
          value={form.homecell}
          onChange={(e) => setForm({ ...form, homecell: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded"
          required
        >
          <option value="">Select Homecell</option>
          {homecells.map((hc: any) => (
            <option key={hc.id} value={hc.name}>
              {hc.name} ({hc.location})
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-yellow-500 text-black font-semibold p-2 rounded hover:bg-yellow-600"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>

      {/* ✅ Modal Component */}
      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Thank You!">
          <p>Your homecell request has been submitted. We’ll contact you shortly.</p>
        </Modal>
      )}
    </div>
  );
}
