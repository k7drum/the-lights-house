"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import emailjs from "@emailjs/browser";

interface Homecell {
  id: string;
  name: string;
  location?: string;
  leader?: string;
  meetingTime?: string;
  // add any other fields you store on each homecell
}

export default function HomecellRequestPage() {
  const [homecells, setHomecells] = useState<Homecell[]>([]);
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
      const list: Homecell[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Homecell, "id">),
      }));
      setHomecells(list);
    } catch (error) {
      console.error("Error fetching homecells:", error);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to request a homecell.");
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, "pendingHomecellRequests"), {
        ...form,
        userId: user.uid,
        email: user.email,
        status: "pending",
        submittedAt: new Date(),
      });

      // Optional: send email notification via EmailJS
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

      setShowModal(true);
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

  if (loading) {
    return <p className="text-center text-gray-400">Checking authentication...</p>;
  }
  if (!user) {
    return <p className="text-center text-red-500">Please log in to access this page.</p>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">Join a Homecell Group</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-gray-800 p-4 rounded-lg shadow-md"
      >
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 rounded"
          required
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 rounded"
          required
        />
        <input
          type="number"
          name="age"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 rounded"
        />
        <textarea
          name="faithJourney"
          placeholder="Briefly describe your faith journey or spiritual needs"
          value={form.faithJourney}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 rounded"
        />
        <select
          name="homecell"
          value={form.homecell}
          onChange={handleChange}
          className="w-full p-2 bg-gray-700 rounded"
          required
        >
          <option value="">Select Homecell</option>
          {homecells.map((hc) => (
            <option key={hc.id} value={hc.name}>
              {hc.name} {hc.location && `(${hc.location})`}
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

      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="Thank You!">
          <p>Your homecell request has been submitted. We’ll contact you shortly.</p>
        </Modal>
      )}
    </div>
  );
}
