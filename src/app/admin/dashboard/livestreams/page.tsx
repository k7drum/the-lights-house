"use client";
import { useState, useEffect } from "react";
import { db, storage } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Trash2, UploadCloud, PlayCircle, CalendarClock } from "lucide-react";
import ChatBox from "@/components/livestream/ChatBox";

export default function LivestreamsPage() {
  const [livestreams, setLivestreams] = useState<any[]>([]);
  const [selectedLivestream, setSelectedLivestream] = useState<string | null>(null);
  const [newLivestream, setNewLivestream] = useState({
    title: "",
    description: "",
    videoFile: null,
    videoURL: "",
    type: "upload", // "upload" or "link"
    status: "live", // "live", "offline", "scheduled"
    scheduleDate: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchLivestreams();
  }, []);

  // ✅ Fetch Livestreams from Firestore
  const fetchLivestreams = async () => {
    const querySnapshot = await getDocs(collection(db, "livestreams"));
    const livestreamList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setLivestreams(livestreamList);
    if (livestreamList.length > 0) setSelectedLivestream(livestreamList[0].id);
  };

  // ✅ Handle Video Upload
  const handleVideoUpload = async (file: File | null) => {
    if (!file) return null;
    const storageRef = ref(storage, `livestreams/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // ✅ Add Livestream (Upload Video or Add Link)
  const addLivestream = async () => {
    if (!newLivestream.title || !newLivestream.description) {
      alert("Please fill all fields!");
      return;
    }

    setUploading(true);
    try {
      let videoURL = newLivestream.videoURL;

      if (newLivestream.type === "upload" && newLivestream.videoFile) {
        videoURL = await handleVideoUpload(newLivestream.videoFile);
      }

      await addDoc(collection(db, "livestreams"), {
        title: newLivestream.title,
        description: newLivestream.description,
        videoURL,
        type: newLivestream.type,
        status: newLivestream.status,
        scheduleDate: newLivestream.status === "scheduled" ? newLivestream.scheduleDate : null,
        createdAt: new Date(),
      });

      setNewLivestream({
        title: "",
        description: "",
        videoFile: null,
        videoURL: "",
        type: "upload",
        status: "live",
        scheduleDate: "",
      });

      fetchLivestreams();
      alert("Livestream Added Successfully!");
    } catch (error) {
      console.error("Error adding livestream:", error);
      alert("Failed to add livestream.");
    }
    setUploading(false);
  };

  // ✅ Delete Livestream
  const deleteLivestream = async (id: string) => {
    await deleteDoc(doc(db, "livestreams", id));
    fetchLivestreams();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Livestreams</h1>

      {/* Add Livestream Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Add New Livestream</h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Title"
            value={newLivestream.title}
            onChange={(e) => setNewLivestream({ ...newLivestream, title: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Description"
            value={newLivestream.description}
            onChange={(e) => setNewLivestream({ ...newLivestream, description: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <select
            value={newLivestream.type}
            onChange={(e) => setNewLivestream({ ...newLivestream, type: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          >
            <option value="upload">Upload Video</option>
            <option value="link">YouTube/Vimeo Link</option>
          </select>
          {newLivestream.type === "upload" ? (
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setNewLivestream({ ...newLivestream, videoFile: e.target.files?.[0] || null })}
              className="p-2 bg-gray-700 rounded"
            />
          ) : (
            <input
              type="text"
              placeholder="YouTube/Vimeo Link"
              value={newLivestream.videoURL}
              onChange={(e) => setNewLivestream({ ...newLivestream, videoURL: e.target.value })}
              className="p-2 bg-gray-700 rounded"
            />
          )}
          <select
            value={newLivestream.status}
            onChange={(e) => setNewLivestream({ ...newLivestream, status: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          >
            <option value="live">Live</option>
            <option value="offline">Offline</option>
            <option value="scheduled">Scheduled</option>
          </select>
          {newLivestream.status === "scheduled" && (
            <input
              type="datetime-local"
              value={newLivestream.scheduleDate}
              onChange={(e) => setNewLivestream({ ...newLivestream, scheduleDate: e.target.value })}
              className="p-2 bg-gray-700 rounded"
            />
          )}
        </div>
        <button
          onClick={addLivestream}
          disabled={uploading}
          className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center"
        >
          {uploading ? "Uploading..." : <><UploadCloud className="mr-2" /> Upload & Save</>}
        </button>
      </div>

      {/* Livestream List */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">All Livestreams</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {livestreams.map((livestream) => (
            <div key={livestream.id} className="bg-gray-900 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold">{livestream.title}</h3>
              <p className="text-gray-300">{livestream.description}</p>
              {livestream.type === "upload" ? (
                <video src={livestream.videoURL} controls className="w-full mt-2" />
              ) : (
                <iframe
                  src={livestream.videoURL.replace("watch?v=", "embed/")}
                  title={livestream.title}
                  className="w-full mt-2"
                  allowFullScreen
                ></iframe>
              )}
              <div className="flex justify-between items-center mt-2">
                <span className={`px-2 py-1 rounded ${livestream.status === "live" ? "bg-green-600" : "bg-gray-600"}`}>
                  {livestream.status.toUpperCase()}
                </span>
                <button onClick={() => deleteLivestream(livestream.id)} className="text-red-500">
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Box */}
      {selectedLivestream && <ChatBox livestreamId={selectedLivestream} />}
    </div>
  );
}
