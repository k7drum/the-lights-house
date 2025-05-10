"use client";

import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { toast, Toaster } from "react-hot-toast"; // ✅ Correct Toast
import Head from "next/head"; // ✅ Correct Head import

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [rsvp, setRsvp] = useState({ name: "", email: "", eventId: "" });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventList);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvpSubmit = async (e: any) => {
    e.preventDefault();
  
    if (!rsvp.name || !rsvp.email) {
      toast.error("Please fill out all fields");
      return;
    }
  
    try {
      setLoading(true); // ✅ New: Show loading spinner
      await addDoc(collection(db, "rsvps"), {
        ...rsvp,
        timestamp: new Date(),
      });
      toast.success(`RSVP submitted for ${rsvp.name}`);
      setRsvp({ name: "", email: "", eventId: "" });
    } catch (error) {
      console.error("Error saving RSVP:", error);
      toast.error("Failed to submit RSVP");
    } finally {
      setLoading(false);
    }
  };
  

  // Pagination Logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(events.length / eventsPerPage);

  return (
    <div className="bg-black min-h-screen text-white">
      {/* ✅ React Hot Toast Provider */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* ✅ SEO Meta */}
      <Head>
        <title>Upcoming Events | The Light's House</title>
        <meta name="description" content="Discover upcoming events at The Light's House. Join us and be part of something special." />
      </Head>

      {/* ✅ Events Header */}
      <motion.section
        className="py-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-bold mb-6">Upcoming Events</h1>
        <p className="text-gray-300">Be part of something special. Join our events!</p>
      </motion.section>

      {/* ✅ Skeleton Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-yellow-500 border-dashed rounded-full animate-spin"></div>
        </div>
        ) : (

        <>
          {/* ✅ Events List */}
          <section className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentEvents.map((event: any) => (
              <motion.div
              key={event.id}
              className="bg-gray-800 p-6 rounded-lg shadow-md transform transition-transform hover:scale-105 hover:shadow-xl duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
            
                <h2 className="text-2xl font-bold mb-3">{event.title}</h2>
                <p className="text-yellow-400">{dayjs(event.date).format("MMMM D, YYYY h:mm A")}</p>
                <p className="mt-2 text-gray-300">{event.description?.substring(0, 100)}...</p>

                {/* Paid / Free Badge */}
                <div className="mt-3">
                  {event.isPaid ? (
                    <span className="inline-block bg-red-500 px-3 py-1 text-sm rounded-full">Paid Event</span>
                  ) : (
                    <span className="inline-block bg-green-500 px-3 py-1 text-sm rounded-full">Free Event</span>
                  )}
                </div>

                {/* RSVP Form */}
                <form onSubmit={handleRsvpSubmit} className="mt-5 space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={rsvp.eventId === event.id ? rsvp.name : ""}
                    onChange={(e) => setRsvp({ ...rsvp, name: e.target.value, eventId: event.id })}
                    className="w-full p-2 rounded bg-gray-700 placeholder-gray-400 focus:outline-none"
                  />
                  <input
                    type="email"
                    required
                    placeholder="Your Email"
                    value={rsvp.eventId === event.id ? rsvp.email : ""}
                    onChange={(e) => setRsvp({ ...rsvp, email: e.target.value, eventId: event.id })}
                    className="w-full p-2 rounded bg-gray-700 placeholder-gray-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-yellow-500 text-black font-semibold py-2 rounded hover:bg-yellow-600 transition duration-300 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                    {loading ? "Submitting..." : "RSVP Now"}
                    </button>

                </form>
              </motion.div>
            ))}
          </section>

          {/* ✅ Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`mx-1 px-4 py-2 rounded ${currentPage === i + 1 ? "bg-yellow-500 text-black" : "bg-gray-700 text-white"} hover:bg-yellow-600 transition`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

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
