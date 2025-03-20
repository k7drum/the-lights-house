"use client";
import { useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

export default function AddNewBlog() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState([]); // Store user-defined categories
  const [tags, setTags] = useState([]);
  const [authorName, setAuthorName] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [authorImage, setAuthorImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("draft"); // "draft" or "published"
  const router = useRouter();

  // ✅ Handle Adding Tags
  const addTag = (e) => {
    if (e.key === "Enter" && e.target.value) {
      setTags([...tags, e.target.value]);
      e.target.value = "";
    }
  };

  // ✅ Remove Tag
  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // ✅ Add Custom Category
  const addCategory = () => {
    if (customCategory && !categories.includes(customCategory)) {
      setCategories([...categories, customCategory]);
      setCustomCategory("");
    }
  };

  // ✅ Save Blog Post (Draft or Publish)
  const saveBlog = async (publish = false) => {
    if (!title || !description || !content || (!category && categories.length === 0) || tags.length === 0 || !authorName) {
      alert("All fields are required!");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "blogs"), {
        title,
        description,
        content,
        category: category || categories[0], // Use selected or first custom category
        tags,
        author: {
          name: authorName,
          bio: authorBio,
          image: authorImage,
        },
        status: publish ? "published" : "draft",
        createdAt: Timestamp.now(),
      });

      alert(publish ? "Blog published successfully!" : "Blog saved as draft!");
      router.push("/admin/dashboard/blogs"); // Redirect back
    } catch (error) {
      console.error("Error saving blog:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Add New Blog</h1>

      {/* ✅ Blog Title */}
      <div className="mb-4">
        <label className="block text-gray-400">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="p-2 bg-gray-700 rounded w-full" />
      </div>

      {/* ✅ Blog Description */}
      <div className="mb-4">
        <label className="block text-gray-400">Description</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="p-2 bg-gray-700 rounded w-full" />
      </div>

      {/* ✅ Blog Content */}
      <div className="mb-4">
        <label className="block text-gray-400">Content</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="p-2 bg-gray-700 rounded w-full h-32"></textarea>
      </div>

      {/* ✅ Custom Categories */}
      <div className="mb-4">
        <label className="block text-gray-400">Add Custom Category</label>
        <div className="flex">
          <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="p-2 bg-gray-700 rounded w-full mr-2" />
          <button onClick={addCategory} className="px-4 py-2 bg-blue-500 text-white rounded">Add</button>
        </div>
        <div className="mt-2 flex flex-wrap">
          {categories.map((cat, index) => (
            <span key={index} className="bg-green-600 text-white px-2 py-1 rounded-lg mr-2 mb-2">{cat}</span>
          ))}
        </div>
      </div>

      {/* ✅ Categories Selection */}
      <div className="mb-4">
        <label className="block text-gray-400">Select Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-2 bg-gray-700 rounded w-full">
          <option value="">Select Category</option>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* ✅ Tags Input */}
      <div className="mb-4">
        <label className="block text-gray-400">Tags (Press Enter to Add)</label>
        <input type="text" onKeyDown={addTag} className="p-2 bg-gray-700 rounded w-full" />
        <div className="mt-2 flex flex-wrap">
          {tags.map((tag, index) => (
            <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded-lg mr-2 mb-2 flex items-center">
              {tag}
              <button onClick={() => removeTag(index)} className="ml-2 text-red-400">×</button>
            </span>
          ))}
        </div>
      </div>

      {/* ✅ Author Information */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2 text-gray-300">Author Information</h2>
        <label className="block text-gray-400">Author Name</label>
        <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="p-2 bg-gray-700 rounded w-full mb-2" />

        <label className="block text-gray-400">Author Bio</label>
        <textarea value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} className="p-2 bg-gray-700 rounded w-full mb-2 h-20"></textarea>

        <label className="block text-gray-400">Author Profile Image URL</label>
        <input type="text" value={authorImage} onChange={(e) => setAuthorImage(e.target.value)} className="p-2 bg-gray-700 rounded w-full" />
      </div>

      {/* ✅ Save Buttons */}
      <div className="flex space-x-4">
        <button onClick={() => saveBlog(false)} disabled={loading} className="px-4 py-2 bg-gray-500 text-white rounded-lg flex items-center">
          <Save className="mr-2" /> {loading ? "Saving..." : "Save as Draft"}
        </button>
        <button onClick={() => saveBlog(true)} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center">
          <Save className="mr-2" /> {loading ? "Publishing..." : "Publish Blog"}
        </button>
      </div>
    </div>
  );
}
