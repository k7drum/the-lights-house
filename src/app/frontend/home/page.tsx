// src/app/frontend/home/page.tsx
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

interface Livestream {
  id: string;
  status: "live" | "offline" | string;
  date: string;
  videoURL?: string;
  title?: string;
  imageUrl?: string;
  [key: string]: any;
}

interface MyEvent {
  id: string;
  date: string;
  title?: string;
  imageUrl?: string;
  [key: string]: any;
}

export default function HomePage() {
  // ── Banner state ──
  const [banner, setBanner] = useState({
    title: "Welcome to The Light's House",
    subtitle: "A place of faith and transformation",
    mediaType: "image" as "image" | "video",
    mediaUrl: "/default-banner.jpg",
  });

  const [sermons, setSermons] = useState<any[]>([]);
  const [liveStream, setLiveStream] = useState<Livestream | null>(null);
  const [events, setEvents] = useState<MyEvent[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [nextEvent, setNextEvent] = useState<MyEvent | null>(null);
  const [countdown, setCountdown] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      await Promise.all([
        fetchBanner(),
        fetchSermons(),
        fetchEvents(),
        fetchBlogs(),
        fetchLiveStream(),
      ]);
    }
    fetchAll();
  }, []);

  useEffect(() => {
    if (!nextEvent?.date) return;
    const iv = setInterval(() => {
      const diff = dayjs(nextEvent.date).diff(dayjs());
      if (diff <= 0) {
        setCountdown("Event is live!");
        clearInterval(iv);
      } else {
        setCountdown(dayjs(nextEvent.date).fromNow(true));
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [nextEvent]);

  async function fetchBanner() {
    try {
      const refDoc = doc(db, "settings", "config");
      const snap = await getDoc(refDoc);
      if (snap.exists()) {
        setBanner((snap.data() as any).homepageBanner);
      }
    } catch (err) {
      console.error("fetchBanner:", err);
    }
  }

  async function fetchLiveStream() {
    try {
      const snap = await getDocs(collection(db, "livestreams"));
      const list: Livestream[] = snap.docs.map(d => {
        const { id: _omit, ...data } = d.data() as Livestream;
        return { id: d.id, ...data };
      });
      const live = list.find(i => i.status === "live");
      const past = list
        .filter(i => i.status === "offline")
        .sort((a, b) => dayjs(b.date).diff(dayjs(a.date)))[0];
      setLiveStream(live || past || null);
    } catch (err) {
      console.error("fetchLiveStream:", err);
    }
  }

  async function fetchSermons() {
    try {
      const snap = await getDocs(collection(db, "sermons"));
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setSermons(list);
    } catch (err) {
      console.error("fetchSermons:", err);
    }
  }

  async function fetchEvents() {
    try {
      const snap = await getDocs(collection(db, "events"));
      const list: MyEvent[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setEvents(list);
      const upcoming = list
        .filter(e => dayjs(e.date).isAfter(dayjs()))
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))[0];
      setNextEvent(upcoming || null);
    } catch (err) {
      console.error("fetchEvents:", err);
    }
  }

  async function fetchBlogs() {
    try {
      const snap = await getDocs(collection(db, "blogs"));
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setBlogs(list);
    } catch (err) {
      console.error("fetchBlogs:", err);
    }
  }

  function getEmbedUrl(url: string) {
    if (!url) return "";
    if (url.includes("youtu")) {
      const id = url.includes("youtu.be/")
        ? url.split("/").pop()
        : new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${id}?rel=0&autoplay=1&mute=1`;
    }
    if (url.includes("vimeo")) {
      return `https://player.vimeo.com/video/${url.split('/').pop()}`;
    }
    return url;
  }

  return (
    <div className="bg-black text-white">
      
      {/* ── Hero Section / Header Banner ── */}
      <motion.section
        className="relative h-screen flex items-center justify-center text-center overflow-hidden"
      >
        {banner.mediaType === "video" ? (
          <video
            autoPlay
            loop
            muted
            className="absolute inset-0 object-cover w-full h-full"
          >
            <source src={banner.mediaUrl} />
          </video>
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banner.mediaUrl})` }}
          />
        )}

        {/* Dark overlay so the text is legible */}
        <div className="absolute inset-0 bg-black bg-opacity-60" />

        {/* Centered text/content */}
        <div className="z-10 px-4 max-w-4xl">
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {banner.title}
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-300 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {banner.subtitle}
          </motion.p>
          <Link href="/frontend/livestream">
            <button className="px-6 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-600 transition">
              Watch Online
            </button>
          </Link>
        </div>
      </motion.section>
      {/* ──────────────────────────────────────── */}


      {/* Live Stream + Quick Actions */}
      <section className="px-6 py-20 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Video Pane */}
          <motion.div className="relative overflow-hidden rounded-xl shadow-xl border-2 border-yellow-500">
            {liveStream?.videoURL ? (
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  src={getEmbedUrl(liveStream.videoURL)}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 bg-gray-800 rounded-lg">
                <p className="text-gray-400 mb-4">No livestream available</p>
                <Link href="/sermons">
                  <button className="px-4 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition">
                    Watch Past Sermons
                  </button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Actions Pane */}
          <motion.div className="text-center md:text-left">
            <h2 className="text-4xl font-bold mb-4">Welcome to The Light's House Church</h2>
            <p className="text-gray-300 mb-8 max-w-lg">
              A grace-based, Jesus-centered teaching and worship environment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md mx-auto md:mx-0 mb-8">
              {[
                { href: "/frontend/schedule", label: "Service Schedule" },
                { href: "/frontend/new-here", label: "I'm New Here" },
                { href: "/frontend/giving", label: "Give Online" },
                { href: "/frontend/lobby", label: "Join the Lobby" },
                { href: "/frontend/prayer-wall", label: "I Have a Prayer Request" },
              ].map(btn => (
                <Link key={btn.href} href={btn.href}>
                  <button className="w-full py-3 px-4 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 transition">
                    {btn.label}
                  </button>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Fullscreen Overlay */}
      {isFullscreen && liveStream?.videoURL && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative w-full max-w-5xl aspect-video">
            <iframe
              src={getEmbedUrl(liveStream.videoURL)}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
            <button onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded">
              Close
            </button>
          </div>
        </div>
      )}


      {/* ── Two-Column “About & Vision” + Pastor Photo (full-width image) ── */}
      <motion.section
        className="py-16 bg-gray-800 text-white"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          {/* Left: Description & Vision */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold">Our Vision & Mission</h2>
            <p className="text-gray-300 leading-relaxed">
              At The Light’s House Church, we believe in transforming lives through the power 
              of grace, community, and heartfelt worship. Our mission is to share Jesus’s 
              message of hope, compassion, and renewal—reaching every generation, restoring 
              every heart, and equipping every believer to live a life of purpose. We are 
              committed to creating an environment where you can grow in faith, find genuine 
              friendships, and discover your unique calling.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>
                <strong>Authentic Worship:</strong> Encounter God through worship that’s 
                heartfelt and unashamed.
              </li>
              <li>
                <strong>Radical Compassion:</strong> Serve our community and extend 
                God’s love to those in need.
              </li>
              <li>
                <strong>Life-Changing Teaching:</strong> Bible-centered messages that 
                inspire transformation.
              </li>
            </ul>
            <Link href="/frontend/what-we-believe">
              <button className="mt-4 px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 transition">
                Learn More About Us
              </button>
            </Link>
          </motion.div>

          {/* Right: Pastor Photo (full-width) */}
          <motion.div
            className="flex justify-center md:justify-end"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src="/images/pastor.png"
                alt="Pastor [Name]"
                width={800}
                height={1000}
                className="object-cover w-full h-full"
                placeholder="blur"
                blurDataURL="/images/pastor-blur.jpg"
              />
            </div>
          </motion.div>
        </div>
      </motion.section>
      {/* ──────────────────────────────────────────────────────── */}


      {/* Upcoming Events */}
      <motion.section className="py-16 bg-gray-900"
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-white mb-8">Upcoming Events</h3>
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {events.slice(0, 3).map((e, i) => (
              <motion.div key={e.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .1 }}>
                <Image
                  src={e.imageUrl || "/images/event-placeholder.jpg"}
                  alt={e.title || "Event"}
                  width={500} height={300}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="text-xl font-semibold text-white">{e.title}</h4>
                  <p className="text-sm text-yellow-400">{dayjs(e.date).format("MMMM D, YYYY h:mm A")}</p>
                  <Link href={`/events/${e.id}`}>
                    <button className="mt-3 px-4 py-2 bg-yellow-500 text-black rounded-md">
                      View Details
                    </button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/events">
              <button className="px-6 py-3 bg-blue-500 text-white rounded-full font-bold">
                See All Events
              </button>
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Two-Card Banner */}
      <motion.section className="py-16 bg-gray-950"
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}>
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2 px-6">
          <motion.div className="bg-gradient-to-br from-yellow-500 to-yellow-400 p-8 rounded-xl text-black shadow-lg"
            whileHover={{ scale: 1.05 }}>
            <div className="mb-4"><img src="/images/community-icon.png" alt="Community" className="w-12 h-12 mx-auto" /></div>
            <h3 className="text-2xl font-bold mb-4">Join Our Community</h3>
            <p className="mb-6">Connect with believers and grow together in faith.</p>
            <Link href="/community"><button className="bg-black text-yellow-400 px-5 py-2 rounded">Learn More</button></Link>
          </motion.div>
          <motion.div className="bg-gray-800 p-8 rounded-xl text-white shadow-lg"
            whileHover={{ scale: 1.05 }}>
            <div className="mb-4"><img src="/images/retreat-icon.png" alt="Retreat" className="w-12 h-12 mx-auto" /></div>
            <h3 className="text-2xl font-bold mb-4">Upcoming Retreat</h3>
            <p className="mb-6">Don’t miss our next retreat—limited spots!</p>
            <Link href="/retreat"><button className="bg-yellow-500 text-black px-5 py-2 rounded">Reserve Spot</button></Link>
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
