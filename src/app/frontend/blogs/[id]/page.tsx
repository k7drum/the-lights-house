"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/config/firebaseConfig";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import dayjs from "dayjs";

interface Blog {
  id: string;
  title: string;
  author: string;
  createdAt: Date | null;
  image?: string;
  description?: string;
  content?: string;
}

export default function BlogDetailPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    try {
      const docRef = doc(db, "blogs", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const fetchedBlog = {
          id: docSnap.id,
          title: data?.title ?? "Untitled",
          author: typeof data.author === "object" ? data.author?.name ?? "Unknown" : data.author ?? "Unknown",
          createdAt: data?.createdAt?.toDate() ?? null,
          image: data?.image ?? "",
          description: data?.description ?? "",
          content: data?.content ?? "",
        };
        setBlog(fetchedBlog);

        // ✅ Fetch related blogs (excluding the current one)
        const querySnapshot = await getDocs(collection(db, "blogs"));
        const allBlogs = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((b) => b.id !== fetchedBlog.id)
          .slice(0, 3) as Blog[]; // Take 3 related blogs

        setRelatedBlogs(allBlogs);
      } else {
        setBlog(null);
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return <p className="text-center text-gray-400 mt-20">Loading blog...</p>;
  }

  if (!blog) {
    return <p className="text-center text-gray-400 mt-20">Blog not found.</p>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* ✅ Blog Content Section */}
      <div className="flex-1 py-12 px-6 max-w-4xl mx-auto">
        {/* ✅ Back Link */}
        <Link href="/frontend/blogs" className="flex items-center text-yellow-400 hover:underline mb-8">
          <span className="mr-2">←</span> Back to Blogs
        </Link>

        {/* ✅ Blog Image */}
        {blog.image && (
          <motion.div
            className="w-full h-64 md:h-96 rounded-lg overflow-hidden mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-full object-cover rounded-lg shadow-lg"
              loading="lazy"
            />
          </motion.div>
        )}

        {/* ✅ Blog Title */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {blog.title}
        </motion.h1>

        {/* ✅ Blog Meta */}
        <div className="text-gray-400 text-sm mb-10">
          By {blog.author} • {blog.createdAt ? dayjs(blog.createdAt).format("MMMM D, YYYY") : "Unknown Date"}
        </div>

        {/* ✅ Blog Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="prose prose-invert max-w-none text-gray-300 space-y-6 prose-p:leading-relaxed prose-p:mb-6 prose-h2:text-2xl prose-h2:font-bold prose-h3:text-xl prose-h3:font-semibold prose-img:rounded-lg prose-img:mx-auto prose-img:border prose-img:border-gray-700"
        >
          {/* This will automatically format paragraphs */}
          <div dangerouslySetInnerHTML={{ __html: blog.content ?? "" }} />
        </motion.div>

        {/* ✅ Share Buttons */}
        <div className="mt-10 flex gap-4 items-center">
          <p className="text-gray-400 text-sm">Share:</p>
          <Link
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm"
          >
            Facebook
          </Link>
          <Link
            href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm"
          >
            WhatsApp
          </Link>
          <button
            onClick={handleCopyLink}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm"
          >
            Copy Link
          </button>
        </div>

        {/* ✅ Related Blogs */}
        {relatedBlogs.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Blogs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedBlogs.map((related) => (
                <Link key={related.id} href={`/frontend/blogs/${related.id}`} className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-all">
                  <h3 className="text-lg font-bold mb-2">{related.title}</h3>
                  <p className="text-sm text-gray-400">
                    {related.createdAt ? dayjs(related.createdAt).format("MMM D, YYYY") : "Unknown date"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
