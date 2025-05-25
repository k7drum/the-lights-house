// src/app/frontend/livestream/page.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import jsPDF from "jspdf";
import { db } from "@/config/firebaseConfig";

const Chat = dynamic(() => import("./chat"), { ssr: false });

const tabs = [
  { id: "notes", label: "Sermon Notes" },
  { id: "chat",  label: "Live Chat"  },
] as const;

interface Livestream {
  id: string;
  status?: string;
  videoURL?: string;
  sermonNoteId?: string;
}

interface SermonNote {
  id: string;
  topic?: string;
  preacher?: string;
  keyScripture?: string;
  songs?: string[];
  content?: string;
}

export default function LiveStreamPage() {
  const [live, setLive]             = useState<Livestream | null>(null);
  const [activeTab, setActiveTab]   = useState<"notes" | "chat">("notes");
  const [note, setNote]             = useState<SermonNote | null>(null);
  const [showModal, setShowModal]   = useState(false);

  useEffect(() => {
    (async () => {
      // 1) find the current live stream doc
      const snap = await getDocs(collection(db, "livestreams"));
      const found = snap.docs
        .map(d => ({ id: d.id, ...(d.data() as any) } as Livestream))
        .find(s => s.status === "live");
      if (!found) return;
      setLive(found);

      // 2) fetch its sermon note if attached
      if (found.sermonNoteId) {
        const noteSnap = await getDoc(doc(db, "sermons", found.sermonNoteId));
        if (noteSnap.exists()) {
          setNote({ id: noteSnap.id, ...(noteSnap.data() as any) });
        }
      }
    })();
  }, []);

  // helper to embed YouTube/Vimeo
  function getEmbedUrl(url: string) {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const id = url.includes("youtu.be/")
        ? url.split("/").pop()
        : new URL(url).searchParams.get("v");
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1`;
    }
    if (url.includes("vimeo.com")) {
      const id = url.split("/").pop();
      return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1`;
    }
    return url;
  }

  const downloadPdf = () => {
    if (!note) return;
    const docPdf = new jsPDF();
    docPdf.setFontSize(16);
    docPdf.text(note.topic || "Sermon Note", 20, 20);
    docPdf.setFontSize(12);
    docPdf.text(`Preacher: ${note.preacher || "N/A"}`, 20, 30);
    docPdf.text(`Key Scripture: ${note.keyScripture || "N/A"}`, 20, 40);
    docPdf.text(`Songs: ${note.songs?.join(", ") || "None"}`, 20, 50);
    docPdf.text("Full Notes:", 20, 60);
    docPdf.text(note.content || "", 20, 70, { maxWidth: 170 });
    docPdf.save(`${note.topic || "sermon"}.pdf`);
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Video Pane */}
          <section className="md:w-2/3 w-full flex items-center justify-center">
            <div className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden border border-gray-700 shadow-lg">
              {live?.videoURL ? (
                <iframe
                  src={getEmbedUrl(live.videoURL)}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  title="Live Stream"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-800">
                  <p className="text-gray-400">No live stream</p>
                </div>
              )}
            </div>
          </section>

          {/* Tabs Pane */}
          <section className="md:w-1/3 w-full flex flex-col">
            <div className="flex border-b border-gray-700 mb-4">
              {tabs.map(t => (
                <button
                  key={t.id}
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
            <div className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-4">
              <AnimatePresence initial={false} mode="wait">
                {activeTab === "notes" ? (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    {note ? (
                      <>
                        <h2 className="text-xl font-bold mb-2">
                          {note.topic}
                        </h2>
                        <p className="text-gray-300 mb-2">
                          <strong>Preacher:</strong> {note.preacher}
                        </p>
                        <p className="text-gray-300 mb-2">
                          <strong>Key Scripture:</strong> {note.keyScripture}
                        </p>
                        <p className="text-gray-300 mb-4">
                          <strong>Songs:</strong> {note.songs?.join(", ")}
                        </p>
                        <p className="line-clamp-3 text-gray-200 mb-4">
                          {note.content}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setShowModal(true)}
                            className="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600"
                          >
                            Read Full
                          </button>
                          <button
                            onClick={downloadPdf}
                            className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-600"
                          >
                            Download PDF
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-400">No sermon note attached.</p>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-full"
                  >
                    {/* Pass livestreamId so chat resets on new stream */}
                    {live?.id && <Chat livestreamId={live.id} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>

      {/* Quick-links */}
      <div className="container mx-auto px-4 pb-12">
        <nav className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: "/frontend/new-here",    label: "I’m New Here" },
            { href: "/frontend/giving",      label: "Give Online", highlight: true },
            { href: "/frontend/prayer-wall", label: "I Have a Prayer Request" },
          ].map(btn => (
            <Link
              key={btn.href}
              href={btn.href}
              className={`block text-center py-3 rounded-lg font-semibold transform transition-transform hover:scale-105 ${
                btn.highlight
                  ? "bg-red-600 text-white"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              {btn.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Full-note Modal */}
      <AnimatePresence>
        {showModal && note && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-900 text-white p-6 w-11/12 md:w-2/3 lg:w-1/2 rounded-lg shadow-xl overflow-y-auto max-h-[80vh]"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h2 className="text-2xl font-bold mb-4">{note.topic}</h2>
              <p className="mb-2"><strong>Preacher:</strong> {note.preacher}</p>
              <p className="mb-2"><strong>Key Scripture:</strong> {note.keyScripture}</p>
              <p className="mb-4"><strong>Songs:</strong> {note.songs?.join(", ")}</p>
              <div className="prose prose-invert max-w-none mb-6">
                {note.content!.split("\n").map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="mt-2 px-4 py-2 bg-red-600 rounded hover:bg-red-700"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
