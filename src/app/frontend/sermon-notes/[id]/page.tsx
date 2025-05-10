"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/config/firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Download, Printer } from "lucide-react";

type Sermon = {
  id?: string;
  title: string;
  speaker: string;
  date: string;
  content: string;
  fileUrl?: string;
  tags?: string[];
  audioUrl?: string;
};

export default function SermonDetailPage() {
  const { id } = useParams();
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [relatedSermons, setRelatedSermons] = useState<Sermon[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSermon = async () => {
      try {
        const docRef = doc(db, "sermons", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const sermonData = docSnap.data() as Sermon;
          setSermon(sermonData);
          fetchRelatedSermons(sermonData.tags || []);
        } else {
          setError("Sermon not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load sermon.");
      }
    };

    const fetchRelatedSermons = async (tags: string[]) => {
      const snapshot = await getDocs(collection(db, "sermons"));
      const all = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Sermon))
        .filter((s) => s.id !== id && tags.some((tag) => s.tags?.includes(tag)));
      setRelatedSermons(all.slice(0, 3));
    };

    if (id) fetchSermon();
  }, [id]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handlePrint = () => window.print();
  const handleDownload = () => {
    const blob = new Blob([sermon?.content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sermon?.title || "sermon"}.txt`;
    a.click();
  };

  if (error) return <p className="text-red-500 text-center mt-6">{error}</p>;
  if (!sermon) return <p className="text-center text-gray-400 mt-6">Loading sermon...</p>;

  return (
    <div className="bg-black text-white min-h-screen px-6 py-16">
      {/* ✅ Back to All Sermons */}
      <div className="mb-8">
        <Link
          href="/frontend/sermon-notes"
          className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-500 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Sermon Notes
        </Link>
      </div>

      {/* ✅ Title Centered */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2">{sermon.title}</h1>
        <p className="text-sm text-gray-400 italic">
          {dayjs(sermon.date).format("MMMM D, YYYY")} &mdash; by {sermon.speaker}
        </p>
      </motion.div>

      {/* ✅ Audio Player */}
      {sermon.audioUrl && (
        <div className="mb-8 text-center">
          <audio controls className="w-full max-w-xl mx-auto">
            <source src={sermon.audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* ✅ Image/Thumbnail */}
      {sermon.fileUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <img
            src={sermon.fileUrl}
            alt="Sermon Thumbnail"
            className="w-full h-auto rounded-lg shadow-xl border border-gray-700"
            loading="lazy"
          />
        </motion.div>
      )}

      {/* ✅ Print & Download Buttons */}
      <div className="flex flex-wrap gap-4 justify-center mb-10">
        <button
          onClick={handlePrint}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-white flex items-center gap-2"
        >
          <Printer size={18} /> Print
        </button>
        <button
          onClick={handleDownload}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-white flex items-center gap-2"
        >
          <Download size={18} /> Download
        </button>
      </div>

      {/* ✅ Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="prose prose-invert prose-lg max-w-5xl text-gray-300 leading-relaxed mx-auto"
      >
        {sermon.content.split("\n").map((p, i) => (
          <p key={i}>{p.trim()}</p>
        ))}
      </motion.div>

      {/* ✅ Tags */}
      {sermon.tags?.length > 0 && (
        <div className="mt-10">
          <h4 className="text-lg font-semibold text-yellow-500 mb-2">Tags:</h4>
          <div className="flex flex-wrap gap-2">
            {sermon.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-gray-700 text-sm rounded-full border border-gray-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Related Sermons */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">
          Related Sermons
        </h2>
        {relatedSermons.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {relatedSermons.map((s) => (
              <Link key={s.id} href={`/frontend/sermon-notes/${s.id}`}>
                <div className="bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-all shadow-md cursor-pointer">
                  <h3 className="text-xl font-semibold mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-400">
                    {dayjs(s.date).format("MMM D, YYYY")} — {s.speaker}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No related sermons found.</p>
        )}
      </div>
    </div>
  );
}
