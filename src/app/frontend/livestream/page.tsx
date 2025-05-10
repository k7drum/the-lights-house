"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { FaHandsPraying, FaGift, FaUser } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";



// no-SSR import of your live chat panel
const Chat = dynamic(() => import("./chat"), { ssr: false });


const tabs = [
    { id: "notes", label: "Sermon Notes" },
    { id: "chat",  label: "Live Chat"    },
  ] as const;
  

  export default function LiveStreamPage() {
    // 1️⃣ State/hooks inside component
    const [liveStreamUrl, setLiveStreamUrl] = useState("");
    const [activeTab, setActiveTab] = useState<typeof tabs[number]["id"]>("notes");
  
    useEffect(() => {
      async function fetchLive() {
        try {
          const snap = await getDocs(collection(db, "livestreams"));
          const list = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((item) => item.status === "live");
          if (list.length) setLiveStreamUrl(list[0].videoURL);
        } catch (err) {
          console.error("Error fetching livestream:", err);
        }
      }
      fetchLive();
    }, []);
  
    // 2️⃣ Render
    return (
      <div className="flex flex-col w-full h-full bg-black text-white">
  
        {/* ——— Split screen: video + tabs ——— */}
        <div className="flex flex-col md:flex-row flex-1">
  
          {/* Video pane */}
          <section className="md:w-2/3 w-full p-4 bg-black flex items-center justify-center">
            <div className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden border border-gray-700 shadow-md">
              {liveStreamUrl ? (
                <iframe
                  src={
                    liveStreamUrl.includes("youtube.com")
                      ? liveStreamUrl.replace("watch?v=", "embed/") + "?rel=0&modestbranding=1&autoplay=1"
                      : liveStreamUrl.includes("vimeo.com")
                        ? liveStreamUrl.replace("vimeo.com/", "player.vimeo.com/video/")
                        : liveStreamUrl
                  }
                  loading="lazy"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  title="Live Stream"
                />
              ) : (
                <div className="bg-gray-800 text-center p-10 rounded-lg h-72 flex items-center justify-center">
                  <p className="text-gray-400">No livestream currently available</p>
                </div>
              )}
            </div>
          </section>
  
          {/* Tabs pane */}
          <section className="md:w-1/3 w-full p-4 bg-gray-900 flex flex-col">
            {/* Tab list */}
            <div role="tablist" className="flex border-b border-gray-700 mb-4">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={activeTab === t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 py-2 text-center font-semibold ${
                    activeTab === t.id
                      ? "border-b-2 border-red-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
  
            {/* Tab panels */}
            <div role="tabpanel" className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4">
              <AnimatePresence mode="wait">
                {activeTab === "notes" ? (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h2 className="text-xl font-bold mb-2">Sermon Title</h2>
                    <p className="space-y-2">
                      <strong>Key Scripture:</strong> John 3:16
                      <br />
                      <strong>Insight 1:</strong> God’s love is unconditional.
                      <br />
                      <strong>Insight 2:</strong> Faith invites transformation.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Chat />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
  
        {/* ——— Quick‑link Cards below ——— */}
        <nav className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 max-w-4xl mx-auto">
          <QuickLink href="/new-here"   icon={<FaUser size={24} />}          label="I’m New Here" />
          <QuickLink href="/give-online" icon={<FaGift size={24} />}          label="Give Online" highlight />
          <QuickLink href="/prayer-request" icon={<FaHandsPraying size={24} />} label="I Have a Prayer Request" />
        </nav>
  
        {/* ——— Subscribe Section ——— */}
        <motion.section
          className="mt-20 py-16 bg-gray-800"
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
              <button className="mt-4 sm:mt-0 sm:ml-2 bg-yellow-500 text-black font-semibold px-6 py-3 rounded-r-lg hover:bg-yellow-600 transition duration-300">
                Subscribe
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    );
  }
  
  // QuickLink helper component stays unchanged:
  function QuickLink({
    href,
    icon,
    label,
    highlight = false,
  }: {
    href: string;
    icon: React.ReactNode;
    label: string;
    highlight?: boolean;
  }) {
    return (
      <Link
        href={href}
        className={`
          flex items-center justify-center space-x-2 p-4 rounded-lg shadow-lg
          transition-transform transform hover:scale-105
          ${highlight
            ? "bg-red-600 text-white"
            : "bg-gray-800 text-white hover:bg-gray-700"}
        `}
      >
        {icon}
        <span className="font-semibold">{label}</span>
      </Link>
    );
  }
  
