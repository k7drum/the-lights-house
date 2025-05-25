"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { db, storage } from "@/config/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  FileImage,
  Film,
  Upload,
  Trash2,
  ArrowLeft,
} from "lucide-react";

interface GalleryItem {
  id: string;
  name: string;
  url: string;
  album: string;
  uploadedAt: string;
}

export default function GalleryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"photos" | "videos">("photos");
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [videos, setVideos] = useState<GalleryItem[]>([]);
  const [albums, setAlbums] = useState<string[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>("");
  const [newAlbum, setNewAlbum] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchGallery();
  }, []);

  // Fetch photos, videos, and album names
  const fetchGallery = async () => {
    try {
      const [photoSnap, videoSnap, albumSnap] = await Promise.all([
        getDocs(collection(db, "gallery_photos")),
        getDocs(collection(db, "gallery_videos")),
        getDocs(collection(db, "gallery_albums")),
      ]);

      const loadedImages = photoSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<GalleryItem, "id">),
      }));
      const loadedVideos = videoSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<GalleryItem, "id">),
      }));
      const loadedAlbums = albumSnap.docs
        .map((d) => d.data() as { name: string })
        .map((a) => a.name);

      setImages(loadedImages);
      setVideos(loadedVideos);
      setAlbums(loadedAlbums);
    } catch (err) {
      console.error("Error fetching gallery:", err);
    }
  };

  // Handle file picker
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setSelectedFiles(files);
  };

  // Upload selected files to Storage and Firestore
  const uploadFiles = async () => {
    if (!selectedFiles.length) {
      alert("Please select files first.");
      return;
    }

    setLoading(true);
    try {
      const uploaded = await Promise.all(
        selectedFiles.map(async (file) => {
          const path = `${activeTab}/${file.name}`;
          const fileRef = ref(storage, path);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          return {
            name: file.name,
            url,
            album: selectedAlbum || "Uncategorized",
            uploadedAt: new Date().toISOString(),
          } as Omit<GalleryItem, "id">;
        })
      );

      const coll = collection(
        db,
        activeTab === "photos" ? "gallery_photos" : "gallery_videos"
      );
      await Promise.all(uploaded.map((item) => addDoc(coll, item)));

      alert(
        `${activeTab === "photos" ? "Images" : "Videos"} uploaded successfully!`
      );
      setSelectedFiles([]);
      fetchGallery();
    } catch (err) {
      console.error("Error uploading files:", err);
      alert("Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a photo or video from Storage and Firestore
  const deleteFile = async (
    id: string,
    url: string,
    type: "photos" | "videos"
  ) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
      await deleteDoc(
        doc(db, type === "photos" ? "gallery_photos" : "gallery_videos", id)
      );
      alert("File deleted successfully!");
      fetchGallery();
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Delete failed.");
    }
  };

  // Add a new album category
  const addAlbum = async () => {
    if (!newAlbum.trim()) {
      alert("Please enter an album name.");
      return;
    }

    try {
      await addDoc(collection(db, "gallery_albums"), { name: newAlbum.trim() });
      setAlbums((prev) => [...prev, newAlbum.trim()]);
      setNewAlbum("");
      alert("Album added successfully!");
    } catch (err) {
      console.error("Error adding album:", err);
      alert("Failed to add album.");
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center text-gray-400 hover:text-white"
      >
        <ArrowLeft className="mr-2" /> Back
      </button>

      <h1 className="text-3xl font-bold mb-4">Gallery</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab("photos")}
          className={`px-4 py-2 rounded-lg flex items-center ${
            activeTab === "photos"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          <FileImage className="mr-2" /> Photos
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={`px-4 py-2 rounded-lg flex items-center ${
            activeTab === "videos"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          <Film className="mr-2" /> Videos
        </button>
      </div>

      {/* Album selector */}
      <div className="mb-4">
        <label className="block text-gray-400">Select Album</label>
        <select
          value={selectedAlbum}
          onChange={(e) => setSelectedAlbum(e.target.value)}
          className="p-2 bg-gray-700 rounded w-full"
        >
          <option value="">Uncategorized</option>
          {albums.map((album) => (
            <option key={album} value={album}>
              {album}
            </option>
          ))}
        </select>
      </div>

      {/* New album */}
      <div className="mb-4 flex space-x-2">
        <input
          type="text"
          placeholder="New Album Name"
          value={newAlbum}
          onChange={(e) => setNewAlbum(e.target.value)}
          className="p-2 bg-gray-700 rounded w-full"
        />
        <button
          onClick={addAlbum}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Add Album
        </button>
      </div>

      {/* File upload */}
      <div className="mb-4">
        <label className="block text-gray-400">
          Select {activeTab === "photos" ? "Photos" : "Videos"}
        </label>
        <input
          type="file"
          multiple
          accept={activeTab === "photos" ? "image/*" : "video/*"}
          onChange={handleFileSelect}
          className="p-2 bg-gray-700 rounded w-full"
        />
        <button
          onClick={uploadFiles}
          disabled={loading || !selectedFiles.length}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded flex items-center"
        >
          <Upload className="mr-2" />
          {loading ? "Uploading..." : "Upload Files"}
        </button>
      </div>

      {/* Gallery list */}
      <h2 className="text-xl font-semibold mb-2">
        {activeTab === "photos" ? "Photo Gallery" : "Video Gallery"}
      </h2>
      <div className="space-y-2">
        {(activeTab === "photos" ? images : videos)
          .filter((item) =>
            item.album === (selectedAlbum || "Uncategorized")
          )
          .map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-gray-800 p-2 rounded-lg"
            >
              <span className="text-gray-300">
                {item.name} ({new Date(item.uploadedAt).toLocaleDateString()})
              </span>
              <button
                onClick={() =>
                  deleteFile(item.id, item.url, activeTab)
                }
                className="bg-red-500 p-2 rounded-full text-white"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
