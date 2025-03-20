"use client";
import { useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

export default function AddNewPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // Simple text content
  const [imageUrl, setImageUrl] = useState(""); // Image URL
  const [status, setStatus] = useState("draft"); // "draft" or "published"
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ✅ Save Page
  const savePage = async (publish = false) => {
    if (!title || !content) {
      alert("Title and Content are required!");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "pages"), {
        title,
        content,
        imageUrl,
        status: publish ? "published" : "draft",
        createdAt: Timestamp.now(),
      });

      alert(publish ? "Page published successfully!" : "Page saved as draft!");
      router.push("/admin/dashboard/pages");
    } catch (error) {
      console.error("Error saving page:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Create New Page</h1>

      {/* ✅ Page Title */}
      <div className="mb-4">
        <label className="block text-gray-400">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="p-2 bg-gray-700 rounded w-full" />
      </div>

      {/* ✅ Page Content */}
      <div className="mb-4">
        <label className="block text-gray-400">Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="p-2 bg-gray-700 rounded w-full h-32"></textarea>
      </div>

      {/* ✅ Image URL */}
      <div className="mb-4">
        <label className="block text-gray-400">Image URL (Optional)</label>
        <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="p-2 bg-gray-700 rounded w-full" />
      </div>

      {/* ✅ Save & Publish Buttons */}
      <div className="flex space-x-4">
        <button onClick={() => savePage(false)} disabled={loading} className="px-4 py-2 bg-gray-500 text-white rounded-lg">
          <Save className="mr-2" /> {loading ? "Saving..." : "Save as Draft"}
        </button>
        <button onClick={() => savePage(true)} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg">
          <Save className="mr-2" /> {loading ? "Publishing..." : "Publish Page"}
        </button>
      </div>
    </div>
  );
}
