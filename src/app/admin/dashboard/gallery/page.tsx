"use client";
import { useState, useEffect } from "react";
import { db, storage } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { FileImage, Film, Upload, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GalleryPage() {
  const [activeTab, setActiveTab] = useState("photos"); // "photos" or "videos"
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(""); // Selected album
  const [newAlbum, setNewAlbum] = useState(""); // New album name
  const [selectedFiles, setSelectedFiles] = useState([]); // Files to be uploaded
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchGallery();
  }, []);

  // ✅ Fetch Gallery Data (Photos, Videos, and Albums)
  const fetchGallery = async () => {
    try {
      const imageSnapshot = await getDocs(collection(db, "gallery_photos"));
      const videoSnapshot = await getDocs(collection(db, "gallery_videos"));
      const albumSnapshot = await getDocs(collection(db, "gallery_albums"));

      setImages(imageSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setVideos(videoSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setAlbums(albumSnapshot.docs.map((doc) => doc.data().name));
    } catch (error) {
      console.error("Error fetching gallery:", error);
    }
  };

  // ✅ Handle File Selection (Store Files Before Upload)
  const handleFileSelect = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  // ✅ Handle Bulk Uploads
  const uploadFiles = async () => {
    if (!selectedFiles.length) return alert("Please select files first.");

    try {
      setLoading(true);
      const uploadedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          const fileRef = ref(storage, `${activeTab}/${file.name}`);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          return { url, name: file.name, album: selectedAlbum || "Uncategorized", uploadedAt: new Date().toISOString() };
        })
      );

      // Save to Firestore
      const collectionRef = collection(db, activeTab === "photos" ? "gallery_photos" : "gallery_videos");
      await Promise.all(uploadedFiles.map((file) => addDoc(collectionRef, file)));

      alert(`${activeTab === "photos" ? "Images" : "Videos"} uploaded successfully!`);
      setSelectedFiles([]); // Clear selected files
      fetchGallery();
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete Image or Video
  const deleteFile = async (id, url, type) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
      await deleteDoc(doc(db, type === "photos" ? "gallery_photos" : "gallery_videos", id));
      alert("File deleted successfully!");
      fetchGallery();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  // ✅ Add New Album
  const addAlbum = async () => {
    if (!newAlbum) return alert("Please enter an album name.");

    try {
      await addDoc(collection(db, "gallery_albums"), { name: newAlbum });
      setAlbums([...albums, newAlbum]);
      setNewAlbum("");
      alert("Album added successfully!");
    } catch (error) {
      console.error("Error adding album:", error);
    }
  };

  return (
    <div className="p-6">
      {/* ✅ Back Button */}
      <button onClick={() => router.back()} className="mb-4 flex items-center text-gray-400 hover:text-white">
        <ArrowLeft className="mr-2" /> Back
      </button>

      <h1 className="text-3xl font-bold mb-4">Gallery</h1>

      {/* ✅ Tab Navigation */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab("photos")}
          className={`px-4 py-2 rounded-lg flex items-center ${activeTab === "photos" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}
        >
          <FileImage className="mr-2" /> Photos
        </button>
        <button
          onClick={() => setActiveTab("videos")}
          className={`px-4 py-2 rounded-lg flex items-center ${activeTab === "videos" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}
        >
          <Film className="mr-2" /> Videos
        </button>
      </div>

      {/* ✅ Album Categories */}
      <div className="mb-4">
        <label className="block text-gray-400">Select Album</label>
        <select value={selectedAlbum} onChange={(e) => setSelectedAlbum(e.target.value)} className="p-2 bg-gray-700 rounded w-full">
          <option value="">Uncategorized</option>
          {albums.map((album, index) => (
            <option key={index} value={album}>{album}</option>
          ))}
        </select>
      </div>

      {/* ✅ Create New Album */}
      <div className="mb-4 flex space-x-2">
        <input
          type="text"
          placeholder="New Album Name"
          value={newAlbum}
          onChange={(e) => setNewAlbum(e.target.value)}
          className="p-2 bg-gray-700 rounded w-full"
        />
        <button onClick={addAlbum} className="px-4 py-2 bg-green-500 text-white rounded">Add Album</button>
      </div>

      {/* ✅ File Selection & Upload */}
      <div className="mb-4">
        <label className="block text-gray-400">Select {activeTab === "photos" ? "Photos" : "Videos"}</label>
        <input type="file" multiple accept={activeTab === "photos" ? "image/*" : "video/*"} onChange={handleFileSelect} className="p-2 bg-gray-700 rounded w-full" />
        <button onClick={uploadFiles} disabled={loading || !selectedFiles.length} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded flex items-center">
          <Upload className="mr-2" /> {loading ? "Uploading..." : "Upload Files"}
        </button>
      </div>

      {/* ✅ List View for Uploaded Files */}
      <h2 className="text-xl font-semibold mb-2">{activeTab === "photos" ? "Photo Gallery" : "Video Gallery"}</h2>
      <div className="space-y-2">
        {(activeTab === "photos" ? images : videos)
          .filter((item) => item.album === (selectedAlbum || "Uncategorized"))
          .map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-gray-800 p-2 rounded-lg">
              <span className="text-gray-300">{item.name} ({new Date(item.uploadedAt).toLocaleDateString()})</span>
              <button onClick={() => deleteFile(item.id, item.url, activeTab)} className="bg-red-500 p-2 rounded-full text-white">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
