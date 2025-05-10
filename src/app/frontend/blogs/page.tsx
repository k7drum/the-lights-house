"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

interface Blog {
  id: string;
  title: string;
  author: string;
  createdAt: Date | null;
  image?: string;
  description?: string;
  content?: string;
}

// 200 WPM reading time
const calculateReadingTime = (text: string) => {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
};

function BlogCard({ blog, index }: { blog: Blog; index: number }) {
  const { id, title, author, createdAt, image, description, content } = blog;
  const readingTime = calculateReadingTime(content ?? description ?? "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Link
        href={`/frontend/blogs/${id}`}
        className="group block bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transform hover:-translate-y-1 transition"
      >
        <div className="relative h-48 w-full">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-110 transition-transform"
              loading="lazy"
              unoptimized
            />
          ) : (
            <div className="h-full w-full bg-gray-700 flex items-center justify-center">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
        </div>
        <div className="p-6 flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-2 line-clamp-2 text-white">
            {title}
          </h2>
          <div className="flex text-sm text-gray-400 mb-4 space-x-2">
            <span>By {author}</span>
            <span>•</span>
            <span>{readingTime} min read</span>
            <span>•</span>
            <span>
              {createdAt ? dayjs(createdAt).fromNow() : "Unknown date"}
            </span>
          </div>
          <p className="text-gray-300 mb-6 line-clamp-3">
            {description}
          </p>
          <span className="mt-auto inline-block bg-yellow-500 text-black px-4 py-2 rounded-md font-medium group-hover:bg-yellow-600 transition">
            Read More
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const snap = await getDocs(collection(db, "blogs"));
        const list = snap.docs.map(doc => {
          const data = doc.data() as any;
          const authorString =
            typeof data.author === "object" && data.author?.name
              ? data.author.name
              : data.author ?? "Unknown";
          let created: Date | null = null;
          if (data.createdAt instanceof Timestamp) {
            created = data.createdAt.toDate();
          }
          return {
            id: doc.id,
            title: data.title ?? "Untitled",
            author: authorString,
            image: data.image ?? "",
            description: data.description ?? "",
            content: data.content ?? "",
            createdAt: created,
          } as Blog;
        });
        setBlogs(list);
      } catch (e) {
        console.error("Error fetching blogs:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  // Filter & sort
  const filtered = useMemo(() => {
    let filtered = blogs.filter(b =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    filtered.sort((a, b) => {
      const aTime = a.createdAt?.getTime() ?? 0;
      const bTime = b.createdAt?.getTime() ?? 0;
      return sortOrder === "newest" ? bTime - aTime : aTime - bTime;
    });
    return filtered;
  }, [blogs, searchTerm, sortOrder]);

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Church Blog
        </motion.h1>
        <motion.p
          className="text-center text-gray-400 mb-8 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Dive into our latest teachings, reflections, and community stories.
        </motion.p>

        {/* Search & Sort */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as any)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </motion.div>

        {/* Listing */}
        {loading ? (
          <p className="text-center text-gray-500">Loading posts…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500">No posts match your search.</p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-16">
            <AnimatePresence>
              {filtered.map((blog, idx) => (
                <BlogCard key={blog.id} blog={blog} index={idx} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Subscribe Section */}
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
