"use client";
import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { Save, Trash2, ArrowLeft } from "lucide-react";

// Define the BlogPost type for TypeScript
type BlogPost = {
  id?: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  status: "draft" | "published";
  author: {
    name: string;
    email: string;
  };
};

export default function EditBlogPost() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0] || "";

  const [loading, setLoading] = useState(false);
  const [blog, setBlog] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (id) {
      fetchBlogPost();
    }
  }, [id]);

  const fetchBlogPost = async () => {
    if (!id) return;

    try {
      const docRef = doc(db, "blogs", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setBlog({ id: docSnap.id, ...docSnap.data() } as BlogPost);
      } else {
        console.error("Blog post not found!");
      }
    } catch (error) {
      console.error("Error fetching blog post:", error);
    }
  };

  if (!blog) {
    return <p className="text-gray-400">Loading...</p>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBlog((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBlog((prev) =>
      prev ? { ...prev, author: { ...prev.author, [name]: value } } : prev
    );
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      if (!newTag) return;
      setBlog((prev) =>
        prev ? { ...prev, tags: [...prev.tags, newTag] } : prev
      );
      e.currentTarget.value = "";
    }
  };

  const removeTag = (index: number) => {
    setBlog((prev) =>
      prev
        ? { ...prev, tags: prev.tags.filter((_, i) => i !== index) }
        : prev
    );
  };

  const saveBlog = async (publish = false) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, "blogs", id), {
        ...blog,
        status: publish ? "published" : "draft",
      });
      alert(publish ? "Blog published successfully!" : "Blog saved as draft!");
      router.push("/admin/dashboard/blogs");
    } catch (error) {
      console.error("Error updating blog:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async () => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await deleteDoc(doc(db, "blogs", id));
      alert("Blog post deleted successfully!");
      router.push("/admin/dashboard/blogs");
    } catch (error) {
      console.error("Error deleting blog:", error);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition mb-4"
      >
        <ArrowLeft className="mr-2" /> Back
      </button>

      <h1 className="text-3xl font-bold mb-4">Edit Blog Post</h1>

      <div className="mb-4">
        <span
          className={`px-3 py-1 rounded-full text-white ${
            blog.status === "published" ? "bg-green-600" : "bg-gray-500"
          }`}
        >
          {blog.status === "published" ? "Published" : "Draft"}
        </span>
      </div>

      <div className="mb-4">
        <label className="block text-gray-400">Title</label>
        <input
          type="text"
          name="title"
          value={blog.title}
          onChange={handleChange}
          className="p-2 bg-gray-700 rounded w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-400">Description</label>
        <input
          type="text"
          name="description"
          value={blog.description}
          onChange={handleChange}
          className="p-2 bg-gray-700 rounded w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-400">Content</label>
        <textarea
          name="content"
          value={blog.content}
          onChange={handleChange}
          className="p-2 bg-gray-700 rounded w-full h-32"
        ></textarea>
      </div>

      <div className="mb-4">
        <label className="block text-gray-400">Tags (Press Enter to Add)</label>
        <input
          type="text"
          onKeyDown={addTag}
          className="p-2 bg-gray-700 rounded w-full"
        />
        <div className="mt-2 flex flex-wrap">
          {blog.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-blue-600 text-white px-2 py-1 rounded-lg mr-2 mb-2 flex items-center"
            >
              {tag}
              <button
                onClick={() => removeTag(index)}
                className="ml-2 text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => saveBlog(false)}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg flex items-center"
        >
          <Save className="mr-2" /> {loading ? "Saving..." : "Save as Draft"}
        </button>
        <button
          onClick={() => saveBlog(true)}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center"
        >
          <Save className="mr-2" /> {loading ? "Publishing..." : "Publish"}
        </button>
        <button
          onClick={deleteBlog}
          className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center"
        >
          <Trash2 className="mr-2" /> Delete
        </button>
      </div>
    </div>
  );
}
