"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { db } from "@/config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Save } from "lucide-react";

interface BannerData {
  title: string;
  subtitle: string;
  mediaType: "image" | "video";
  mediaUrl: string;
}

export default function BannerSettings() {
  const [banner, setBanner] = useState<BannerData>({
    title: "",
    subtitle: "",
    mediaType: "image",
    mediaUrl: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBanner();
  }, []);

  // Fetch the banner document and populate state
  const fetchBanner = async () => {
    try {
      const docRef = doc(db, "settings", "homepageBanner");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setBanner({
          title: (data.title as string) || "",
          subtitle: (data.subtitle as string) || "",
          mediaType: (data.mediaType as "image" | "video") || "image",
          mediaUrl: (data.mediaUrl as string) || "",
        });
      }
    } catch (err) {
      console.error("Error fetching banner:", err);
    }
  };

  // Save the banner fields individually to satisfy Firestore's typing
  const saveBanner = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "settings", "homepageBanner");
      await updateDoc(docRef, {
        title: banner.title,
        subtitle: banner.subtitle,
        mediaType: banner.mediaType,
        mediaUrl: banner.mediaUrl,
      });
      alert("Banner updated successfully!");
    } catch (err) {
      console.error("Error updating banner:", err);
      alert("Failed to update banner.");
    } finally {
      setLoading(false);
    }
  };

  // Generalized change handler
  const handleChange =
    (field: keyof BannerData) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setBanner((prev) => ({
        ...prev,
        [field]:
          field === "mediaType"
            ? (value as "image" | "video")
            : value,
      }));
    };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Homepage Banner Settings</h1>

      <label className="block text-gray-400">Title</label>
      <input
        type="text"
        value={banner.title}
        onChange={handleChange("title")}
        className="p-2 bg-gray-700 rounded w-full mb-2"
      />

      <label className="block text-gray-400">Subtitle</label>
      <input
        type="text"
        value={banner.subtitle}
        onChange={handleChange("subtitle")}
        className="p-2 bg-gray-700 rounded w-full mb-2"
      />

      <label className="block text-gray-400">Media Type</label>
      <select
        value={banner.mediaType}
        onChange={handleChange("mediaType")}
        className="p-2 bg-gray-700 rounded w-full mb-2"
      >
        <option value="image">Image</option>
        <option value="video">Video</option>
      </select>

      <label className="block text-gray-400">Media URL</label>
      <input
        type="text"
        value={banner.mediaUrl}
        onChange={handleChange("mediaUrl")}
        className="p-2 bg-gray-700 rounded w-full mb-4"
        placeholder="Enter image or video URL"
      />

      <button
        onClick={saveBanner}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center"
      >
        <Save className="mr-2" />
        {loading ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
