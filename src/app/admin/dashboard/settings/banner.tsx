"use client";
import { useState, useEffect } from "react";
import { db } from "@/config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Save } from "lucide-react";

export default function BannerSettings() {
  const [banner, setBanner] = useState({
    title: "",
    subtitle: "",
    mediaType: "image",
    mediaUrl: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBanner();
  }, []);

  // ✅ Fetch Banner Data
  const fetchBanner = async () => {
    try {
      const docRef = doc(db, "settings", "homepageBanner");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBanner(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
    }
  };

  // ✅ Save Banner Data
  const saveBanner = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "settings", "homepageBanner"), banner);
      alert("Banner updated successfully!");
    } catch (error) {
      console.error("Error updating banner:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Homepage Banner Settings</h1>

      <label className="block text-gray-400">Title</label>
      <input
        type="text"
        value={banner.title}
        onChange={(e) => setBanner({ ...banner, title: e.target.value })}
        className="p-2 bg-gray-700 rounded w-full mb-2"
      />

      <label className="block text-gray-400">Subtitle</label>
      <input
        type="text"
        value={banner.subtitle}
        onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })}
        className="p-2 bg-gray-700 rounded w-full mb-2"
      />

      <label className="block text-gray-400">Media Type</label>
      <select
        value={banner.mediaType}
        onChange={(e) => setBanner({ ...banner, mediaType: e.target.value })}
        className="p-2 bg-gray-700 rounded w-full mb-2"
      >
        <option value="image">Image</option>
        <option value="video">Video</option>
      </select>

      <label className="block text-gray-400">Media URL</label>
      <input
        type="text"
        placeholder="Enter image or video URL"
        value={banner.mediaUrl}
        onChange={(e) => setBanner({ ...banner, mediaUrl: e.target.value })}
        className="p-2 bg-gray-700 rounded w-full mb-2"
      />

      <button
        onClick={saveBanner}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center"
      >
        <Save className="mr-2" /> {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
