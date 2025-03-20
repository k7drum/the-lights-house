"use client";
import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion"; // ✅ Import Framer Motion

export default function HomePage() {
  const [banner, setBanner] = useState({
    title: "Welcome to The Light's House",
    subtitle: "A place of faith and transformation",
    mediaType: "image",
    mediaUrl: "/default-banner.jpg",
  });

  const [sermons, setSermons] = useState([]);
  const [events, setEvents] = useState([]);
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    fetchBanner();
    fetchSermons();
    fetchEvents();
    fetchBlogs();
  }, []);

  // ✅ Fetch Banner Data from Firestore
  const fetchBanner = async () => {
    try {
      const docRef = doc(db, "settings", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBanner(docSnap.data().homepageBanner);
      } else {
        console.warn("No homepage banner found, using default.");
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
    }
  };
  
  

  const fetchSermons = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "sermons"));
      setSermons(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching sermons:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      setEvents(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchBlogs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "blogs"));
      setBlogs(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching blogs:", error);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* ✅ Hero Section with Parallax Effect */}
      <section className="relative h-screen flex items-center justify-center text-center bg-cover bg-center overflow-hidden">
        {banner.mediaType === "video" ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={banner.mediaUrl} type="video/mp4" />
          </video>
        ) : (
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banner.mediaUrl})` }}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          ></motion.div>
        )}

        {/* ✅ Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        {/* ✅ Banner Content with Fade-in Animation */}
        <motion.div
          className="z-10 px-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl font-bold mb-4">{banner.title}</h1>
          <p className="text-lg mb-6">{banner.subtitle}</p>
          <Link href="/watch-online">
            <motion.button
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Watch Live
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* ✅ Featured Sections with Slide-in Animation */}
      <motion.section
        className="py-16 px-6 max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Featured Content</h2>

        {/* Latest Sermons */}
        <motion.div className="mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <h3 className="text-2xl font-semibold mb-4">Latest Sermons</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sermons.slice(0, 3).map((sermon, index) => (
              <motion.div
                key={sermon.id}
                className="bg-gray-800 p-4 rounded-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h4 className="text-xl font-bold">{sermon.title}</h4>
                <p className="text-gray-400">{sermon.description}</p>
                <Link href={`/sermons/${sermon.id}`}>
                  <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Watch</button>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div className="mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <h3 className="text-2xl font-semibold mb-4">Upcoming Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.slice(0, 2).map((event) => (
              <motion.div
                key={event.id}
                className="bg-gray-800 p-4 rounded-lg"
                whileHover={{ scale: 1.05 }}
              >
                <h4 className="text-xl font-bold">{event.title}</h4>
                <p className="text-gray-400">{event.date}</p>
                <Link href={`/events/${event.id}`}>
                  <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Details</button>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      {/* ✅ Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center">
        <p>© {new Date().getFullYear()} The Light's House. All rights reserved.</p>
      </footer>
    </div>
  );
}
