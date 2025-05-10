"use client";
import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import Image from "next/image";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function HomePage() {
  const [banner, setBanner] = useState({
    title: "Welcome to The Light's House",
    subtitle: "A place of faith and transformation",
    mediaType: "image",
    mediaUrl: "/default-banner.jpg",
  });

  const [sermons, setSermons] = useState([]);
  const [liveStream, setLiveStream] = useState(null);
  const [events, setEvents] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [latestSermonUrl, setLatestSermonUrl] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);


  useEffect(() => {
    async function fetchAllData() {
      await Promise.all([
        fetchBanner(),
        fetchSermons(),
        fetchEvents(),
        fetchBlogs(),
        fetchLiveStream(),
      ]);
    }
  
    fetchAllData();
  }, []);
  

  useEffect(() => {
    if (nextEvent?.date) { // Add optional chaining
      const interval = setInterval(() => {
        const eventDate = dayjs(nextEvent.date);
        const diff = eventDate.diff(dayjs());
        if (diff <= 0) {
          setCountdown("Event is live!");
          clearInterval(interval);
        } else {
          setCountdown(eventDate.fromNow(true));
        }
      }, 1000);
  
      return () => clearInterval(interval);
    }
  }, [nextEvent]);
  

  const fetchBanner = async () => {
    try {
      const docRef = doc(db, "settings", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBanner(docSnap.data().homepageBanner);
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
    }
  };

  const fetchLiveStream = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "livestreams"));
      const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
      // Look for a live stream (or a fallback offline stream)
      const liveStream = list.find(item => item.status === "live");
      const latestPastStream = list
        .filter(item => item.status === "offline")
        .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))[0];
  
      // Log what you get from Firestore for debugging
      console.log("Fetched livestream data:", liveStream || latestPastStream);
      setLiveStream(liveStream || latestPastStream || null);
    } catch (error) {
      console.error("Error fetching livestream:", error);
    }
  };
  


  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    try {
      if (url.includes("youtube.com/watch?v=") || url.includes("youtu.be/")) {
        // Handle both full and shortened URLs
        const embedUrl = url.includes("youtu.be/")
          ? url.replace("youtu.be/", "www.youtube.com/embed/")
          : url.replace("watch?v=", "embed/");
        return embedUrl + "?rel=0&modestbranding=1&controls=0&autoplay=1&mute=1";
      }
      
      if (url.includes("vimeo.com")) {
        const videoId = url.split("/").pop();
        return `https://player.vimeo.com/video/${videoId}`;
      }
      return url; // fallback if no matching condition
    } catch (error) {
      console.error("Error creating embed URL:", error);
      return "";
    }
  };
  
  
  

  const fetchSermons = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "sermons"));
      const sermonList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSermons(sermonList);
      if (sermonList.length > 0) {
        setLatestSermonUrl(sermonList[0].youtubeUrl);
      }
    } catch (error) {
      console.error("Error fetching sermons:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (Array.isArray(eventList)) {
        setEvents(eventList);
        const upcoming = eventList
          .filter(e => dayjs(e.date).isAfter(dayjs()))
          .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))[0];
        setNextEvent(upcoming || null);
      } else {
        setEvents([]);
        setNextEvent(null);
        console.error("Events data is not an array:", eventList);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
      setNextEvent(null);
    }
  };
  

  const fetchBlogs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "blogs"));
      const blogList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (Array.isArray(blogList)) {
        setBlogs(blogList);
      } else {
        setBlogs([]);
        console.error("Blogs data is not an array:", blogList);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
    }
  };
  

  return (
    <div className="bg-black text-white min-h-screen">
      {/* ✅ Hero Section */}
      <motion.section className="relative h-screen flex items-center justify-center text-center overflow-hidden bg-fixed bg-center bg-cover">
  {banner.mediaType === "video" ? (
    <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
      <source src={banner.mediaUrl} type="video/mp4" />
    </video>
  ) : (
    <motion.div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url(${banner.mediaUrl})` }}
      initial={{ scale: 1.2 }}
      animate={{ scale: 1 }}
      transition={{ duration: 1.5 }}
    />
  )}

  <div className="absolute inset-0 bg-black bg-opacity-60"></div>
  
  <div className="z-10 text-center px-4 max-w-4xl">
    <motion.h1 className="text-5xl md:text-6xl font-bold text-white">
      {banner.title}
    </motion.h1>
    <motion.p className="text-lg md:text-xl text-gray-300 mt-4">
      {banner.subtitle}
    </motion.p>
    <Link href="/livestreams">
      <button className="mt-6 px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition">
        Watch Online
      </button>
    </Link>
  </div>
</motion.section>



{/* ✅ Improved Live Stream & Welcome Section */}
<section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-20">
  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
    
    {/* Updated Left Column: Video Player with Fullscreen Toggle */}
    <motion.div
      className="relative w-full rounded-xl overflow-hidden shadow-xl border-2 border-yellow-500"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
    >
      {liveStream && liveStream.videoURL ? (
        <>
          <div className="relative pb-[56.25%] h-0">
            <iframe
              src={`${getEmbedUrl(liveStream.videoURL)}?rel=0&modestbranding=1&controls=1&autoplay=1&mute=1`}
              className="absolute top-0 left-0 w-full h-full rounded-md"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={liveStream.title || "Live Stream"}
            />
          </div>
          <button
            onClick={() => setIsFullscreen(true)}
            className="absolute bottom-3 right-3 z-20 bg-black bg-opacity-60 text-white text-xs px-3 py-1 rounded hover:bg-opacity-80 transition"
          >
            Fullscreen
          </button>
        </>
      ) : (
        <div className="bg-gray-800 text-center p-10 rounded-lg h-full flex flex-col items-center justify-center">
          <p className="text-gray-400">No livestream currently available</p>
          <p className="text-sm text-gray-500 mt-2">Check back later or watch past sermons.</p>
          <Link href="/sermons">
            <button className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-600">
              Watch Past Sermons
            </button>
          </Link>
        </div>
      )}
    </motion.div>

    {/* ✅ Right Column: Welcome & Actions */}
    <motion.div
      className="text-center md:text-left"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <h2 className="text-4xl font-bold text-white mb-4">Welcome to The Light's House Church</h2>
      <p className="text-gray-300 mb-8">
        A grace-based, Jesus-centered teaching and worship environment through an interactive digital church experience.
      </p>
      
      <div className="flex flex-col gap-4 max-w-md mx-auto md:mx-0">
        <Link href="/schedule">
          <button className="w-full bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-shadow shadow-md">
            Service Schedule
          </button>
        </Link>
        <Link href="/new-here">
          <button className="w-full bg-gray-800 text-white border border-gray-600 py-3 px-6 rounded-lg hover:bg-gray-700 transition-shadow shadow-md">
            I'm New Here
          </button>
        </Link>
        <Link href="/give">
          <button className="w-full bg-gray-800 text-white border border-gray-600 py-3 px-6 rounded-lg hover:bg-gray-700 transition-shadow shadow-md">
            Give Online
          </button>
        </Link>
        <Link href="/lobby">
          <button className="w-full bg-gray-800 text-white border border-gray-600 py-3 px-6 rounded-lg hover:bg-gray-700 transition-shadow shadow-md">
            Join the Lobby
          </button>
        </Link>
        <Link href="/prayer-request">
          <button className="w-full bg-gray-800 text-white border border-gray-600 py-3 px-6 rounded-lg hover:bg-gray-700 transition-shadow shadow-md">
            I Have a Prayer Request
          </button>
        </Link>
      </div>
    </motion.div>
  </div>
</section>

{/* Fullscreen Overlay */}
{isFullscreen && liveStream && liveStream.videoURL && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
    <div className="relative w-full max-w-5xl aspect-video">
      <iframe
        src={`${getEmbedUrl(liveStream.videoURL)}?rel=0&modestbranding=1&controls=1&autoplay=1&mute=1`}
        className="w-full h-full rounded-lg"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={liveStream.title || "Live Stream"}
      />
      <button
        onClick={() => setIsFullscreen(false)}
        className="absolute top-4 right-4 text-white bg-black bg-opacity-70 px-4 py-2 rounded hover:bg-opacity-90 transition"
      >
        Close
      </button>
    </div>
  </div>
)}



{/* ✅ Improved Events Section */}
<motion.section
  className="py-16 bg-gray-900"
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
>
  <div className="max-w-6xl mx-auto">
    <h3 className="text-3xl font-bold mb-8 text-white">Upcoming Events</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
      {events.slice(0, 3).map((event, index) => (
        <motion.div
          key={event.id}
          className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {/* Use Next.js Image for optimized lazy loading */}
          <Image
            src={event.imageUrl || "/images/event-placeholder.jpg"}
            alt={event.title || "Event image"}
            width={500}
            height={300}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h4 className="text-xl font-semibold text-white mb-1">{event.title}</h4>
            <p className="text-sm text-yellow-400">
              {dayjs(event.date).format("MMMM D, YYYY h:mm A")}
            </p>
            <Link href={`/events/${event.id}`}>
              <button className="mt-3 px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition">
                View Details
              </button>
            </Link>
          </div>
        </motion.div>
      ))}
    </div>
    {/* See All Events Button */}
    <div className="mt-8 text-center">
      <Link href="/events">
        <button className="px-6 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-colors">
          See All Events
        </button>
      </Link>
    </div>
  </div>
</motion.section>




{/* ✅ Two-Card Banner Section */}
<motion.section
  className="py-16 bg-gray-950"
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
>
  <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
    {/* Card 1 */}
    <motion.div
      className="bg-gradient-to-br from-yellow-500 to-yellow-400 text-black p-8 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
      whileHover={{ scale: 1.05 }}
    >
      {/* Optionally add a custom icon/image above or inside the card */}
      <div className="mb-4">
        <img src="/images/community-icon.png" alt="Community" className="w-12 h-12 mx-auto" loading="lazy" />
      </div>
      <h3 className="text-2xl font-bold mb-4">Join Our Community</h3>
      <p className="mb-6 text-sm md:text-base">Connect with other believers and grow together in faith.</p>
      <Link href="/community">
        <button className="bg-black text-yellow-400 px-5 py-2 rounded hover:bg-gray-900 transition">
          Learn More
        </button>
      </Link>
    </motion.div>

    {/* Card 2 */}
    <motion.div
      className="bg-gray-800 text-white p-8 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
      whileHover={{ scale: 1.05 }}
    >
      {/* Optionally add a custom icon/image above or inside the card */}
      <div className="mb-4">
        <img src="/images/retreat-icon.png" alt="Retreat" className="w-12 h-12 mx-auto" loading="lazy" />
      </div>
      <h3 className="text-2xl font-bold mb-4">Upcoming Retreat</h3>
      <p className="mb-6 text-sm md:text-base">Don't miss our next church retreat! Limited spots available.</p>
      <Link href="/retreat">
        <button className="bg-yellow-500 text-black px-5 py-2 rounded hover:bg-yellow-600 transition">
          Reserve Spot
        </button>
      </Link>
    </motion.div>
  </div>
</motion.section>


{/* ✅ New Two-Card Section */}
<motion.section
  className="py-16 bg-gray-900"
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.2 }}
>
  <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
    {/* Card 3: Metamorphoo Event */}
    <motion.div
      className="bg-gradient-to-br from-green-400 to-green-300 text-black p-8 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
      whileHover={{ scale: 1.05 }}
    >
      <div className="mb-4">
        <img src="/images/metamorphoo-icon.png" alt="Metamorphoo Event" className="w-12 h-12 mx-auto" loading="lazy" />
      </div>
      <h3 className="text-2xl font-bold mb-4">Metamorphoo Event</h3>
      <p className="mb-6 text-sm md:text-base">
        A monthly program to discuss the practicality of grace and transform your life.
      </p>
      <Link href="/events/metamorphoo">
        <button className="bg-black text-green-400 px-5 py-2 rounded hover:bg-gray-900 transition">
          Learn More
        </button>
      </Link>
    </motion.div>

    {/* Card 4: The Light's House Academy */}
    <motion.div
      className="bg-gray-800 text-white p-8 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
      whileHover={{ scale: 1.05 }}
    >
      <div className="mb-4">
        <img src="/images/academy-icon.png" alt="Academy" className="w-12 h-12 mx-auto" loading="lazy" />
      </div>
      <h3 className="text-2xl font-bold mb-4">The Light's House Academy</h3>
      <p className="mb-6 text-sm md:text-base">
        Grow in grace and knowledge through our academy resources designed for spiritual transformation.
      </p>
      <Link href="/academy">
        <button className="bg-yellow-500 text-black px-5 py-2 rounded hover:bg-yellow-600 transition">
          Start Now
        </button>
      </Link>
    </motion.div>
  </div>
</motion.section>



{/* ✅ Improved Sermons Section */}
<motion.section
  className="py-20 bg-gray-900"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 1, delay: 0.4 }}
>
  <div className="max-w-7xl mx-auto px-4 md:px-6">
    <h2 className="text-4xl font-bold text-center mb-12 text-white">Latest Sermons</h2>
    <div className="grid md:grid-cols-3 gap-8">
      {sermons.slice(0, 3).map((sermon) => (
        <motion.div
          key={sermon.id}
          className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300"
          whileHover={{ scale: 1.03 }}
        >
          <Link href={sermon.youtubeUrl || "#"} target="_blank">
            <img
              src={sermon.imageUrl || '/sermon-placeholder.jpg'}
              alt={sermon.title}
              loading="lazy"
              className="w-full h-52 object-cover"
            />
            <div className="p-4">
              <h4 className="text-xl font-semibold">{sermon.title}</h4>
              <p className="text-gray-400 text-sm mt-2">
                {dayjs(sermon.date).format("MMMM D, YYYY")}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  </div>
</motion.section>

{/* ✅ Improved Blog Section */}
<motion.section
  className="py-16 bg-black"
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1, delay: 0.3 }}
  viewport={{ once: true }}
>
  <div className="max-w-6xl mx-auto px-6">
    <h2 className="text-3xl font-bold mb-10 text-white text-center">Latest Blog Posts</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {blogs.slice(0, 3).map((blog, index) => (
        <motion.div
          key={blog.id}
          className="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:scale-105 transition-transform duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          viewport={{ once: true }}
        >
          <Link href={`/frontend/blogs/${blog.id}`} className="group block">
            <Image
              src={blog.coverImage || "/images/placeholder.jpg"}
              alt={blog.title}
              width={500}
              height={300}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            <div className="p-5">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors duration-300">
                {blog.title}
              </h3>

              {blog.category && (
                <span className="inline-block mb-2 px-3 py-1 text-xs bg-yellow-600 text-black rounded-full">
                  {blog.category}
                </span>
              )}

              <p className="text-gray-400 text-sm mb-3 line-clamp-3">
                {blog.description}
              </p>

              <div className="flex items-center text-sm text-gray-400 mt-4">
                {blog.author?.image && (
                  <Image
                    src={blog.author.image}
                    alt={blog.author.name}
                    width={32}
                    height={32}
                    className="rounded-full object-cover mr-2"
                  />
                )}
                <span>{blog.author?.name || "Unknown Author"}</span>
                <span className="mx-2">•</span>
                <span>{blog.readTime || "3 min read"}</span>
              </div>

              <div className="mt-4 text-yellow-500 font-medium hover:underline">
                Read More →
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  </div>
</motion.section>


{/* ✅ Subscribe Section */}
<motion.section
  className="py-16 bg-gray-800"
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
