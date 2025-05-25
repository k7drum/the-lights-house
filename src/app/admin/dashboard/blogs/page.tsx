"use client";
import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { Plus, Trash, Edit } from "lucide-react";

interface Blog {
  id: string;
  title: string;
  description: string;
  [key: string]: any; // Add this if you expect additional fields
}

export default function AdminBlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  // ✅ Fetch Blog Posts from Firestore
  const fetchBlogs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "blogs"));
      const blogList: Blog[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Blog[];
      setBlogs(blogList);
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete Blog Post
  const deleteBlog = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this blog post?")) {
      try {
        await deleteDoc(doc(db, "blogs", id));
        setBlogs((prev) => prev.filter((blog) => blog.id !== id));
        alert("Blog post deleted successfully.");
      } catch (error) {
        console.error("Error deleting blog:", error);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Manage Blog Posts</h1>

      {/* ✅ Add New Blog Post */}
      <div className="mb-4">
        <Link
          href="/admin/dashboard/blogs/new"
          className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center"
        >
          <Plus className="mr-2" /> Add New Blog
        </Link>
      </div>

      {loading ? (
        <p>Loading blogs...</p>
      ) : blogs.length === 0 ? (
        <p>No blog posts available.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog.id} className="p-4 bg-gray-800 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold">{blog.title}</h2>
              <p className="text-gray-400">{blog.description}</p>
              <div className="flex justify-between mt-2">
                <Link
                  href={`/admin/dashboard/blogs/edit/${blog.id}`}
                  className="text-blue-500 flex items-center"
                >
                  <Edit className="mr-1" size={16} /> Edit
                </Link>
                <button
                  onClick={() => deleteBlog(blog.id)}
                  className="text-red-500 flex items-center"
                >
                  <Trash className="mr-1" size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
