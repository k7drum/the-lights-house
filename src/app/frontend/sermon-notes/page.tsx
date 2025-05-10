"use client";

import { motion } from "framer-motion";
import dayjs from "dayjs";
import Link from "next/link";
import { useFetchSermons } from "@/hooks/useFetchSermons";

export default function SermonNotesPage() {
  const { sermons, loading, error } = useFetchSermons();

  // Estimate reading time: 200 words/minute
  const readingTime = (text?: string) => {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.ceil(words / 200);
  };

  return (
    <div className="bg-black text-white min-h-screen p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Sermon Notes</h1>
      {error && <p className="text-red-500 text-center">{error}</p>}
      {loading ? (
        <p className="text-gray-400 text-center">Loading sermons...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sermons.map((s) => (
            <motion.div
              key={s.id}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
            >
              {/* Optional thumbnail */}
              {s.fileUrl && (
                <div className="h-48 bg-gray-700">
                  <img
                    src={s.fileUrl}
                    alt={s.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col">
                <h2 className="text-2xl font-semibold mb-2">{s.title}</h2>
                <p className="text-gray-400 mb-1">
                  <span className="font-medium">Speaker:</span> {s.speaker}
                </p>
                <p className="text-gray-400 mb-1">
                  <span className="font-medium">Date:</span>{" "}
                  {dayjs(s.date).format("MMMM D, YYYY")}
                </p>
                <p className="text-gray-400 mb-4">
                  <span className="font-medium">Read:</span>{" "}
                  {readingTime(s.content)} min
                </p>
                <p className="text-gray-300 flex-1 mb-4 line-clamp-3">
                  {s.content}
                </p>

                <div className="mt-auto">
                  <Link
                    href={`/frontend/sermon-notes/${s.id}`}
                    className="inline-block px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-600 transition"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
