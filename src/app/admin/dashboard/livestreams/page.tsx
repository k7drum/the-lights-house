"use client";
import { useState, useEffect } from "react";
import { db, storage } from "@/config/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  Timestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Trash2,
  UploadCloud,
  Save,
  Pencil,
  PlayCircle,
  CalendarClock,
} from "lucide-react";
import ChatBox from "@/components/livestream/ChatBox";

export default function LivestreamsPage() {
  const [livestreams, setLivestreams] = useState<any[]>([]);
  const [selectedLivestream, setSelectedLivestream] = useState<string | null>(
    null
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [newLivestream, setNewLivestream] = useState({
    title: "",
    description: "",
    videoFile: null,
    videoURL: "",
    thumbnailFile: null,
    thumbnailURL: "",
    type: "upload",
    status: "live",
    scheduleDate: "",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    fetchLivestreams();
  }, []);

  const fetchLivestreams = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "livestreams"));
      const list = querySnapshot.docs.map((doc) => {
        const data = doc.data();
  
        return {
          id: doc.id,
          ...data,
          scheduleDate: data.scheduleDate && data.scheduleDate.toDate
            ? data.scheduleDate.toDate()
            : data.scheduleDate || null,
          startTime: data.startTime && data.startTime.toDate
            ? data.startTime.toDate()
            : data.startTime || null,
          endTime: data.endTime && data.endTime.toDate
            ? data.endTime.toDate()
            : data.endTime || null,
        };
      });
  
      setLivestreams(list);
      if (list.length > 0) setSelectedLivestream(list[0].id);
    } catch (err) {
      console.error("Error fetching livestreams:", err);
    }
  };
  

  const handleVideoUpload = async (file: File | null) => {
    if (!file) return null;
    const storageRef = ref(storage, `livestreams/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const addLivestream = async () => {
    if (!newLivestream.title || !newLivestream.description) {
      alert("Please fill all fields!");
      return;
    }
  
    setUploading(true);
    try {
      let videoURL = newLivestream.videoURL;
      let thumbnailURL = newLivestream.thumbnailURL;
  
      if (newLivestream.type === "upload" && newLivestream.videoFile) {
        videoURL = await handleVideoUpload(newLivestream.videoFile);
      }
  
      if (newLivestream.thumbnailFile) {
        thumbnailURL = await handleThumbnailUpload(newLivestream.thumbnailFile);
        if (!thumbnailURL) {
          alert("Thumbnail upload failed, please try again.");
          setUploading(false);
          return;
        }
      }      
  
      await addDoc(collection(db, "livestreams"), {
        title: newLivestream.title,
        description: newLivestream.description,
        videoURL,
        type: newLivestream.type,
        status: newLivestream.status,
        scheduleDate: newLivestream.status === "scheduled"
          ? Timestamp.fromDate(new Date(newLivestream.scheduleDate))
          : null,
        startTime: newLivestream.startTime
          ? Timestamp.fromDate(new Date(newLivestream.startTime))
          : null,
        endTime: newLivestream.endTime
          ? Timestamp.fromDate(new Date(newLivestream.endTime))
          : null,
        thumbnailURL,
        createdAt: Timestamp.fromDate(new Date()),
      });      
            
  
      setNewLivestream({
        title: "",
        description: "",
        videoFile: null,
        videoURL: "",
        type: "upload",
        status: "live",
        scheduleDate: "",
        startTime: "",
        endTime: "",
        thumbnailFile: null,
        thumbnailURL: "",
      });
  
      fetchLivestreams();
      alert("Livestream Added Successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add livestream.");
    }
    setUploading(false);
  };
  

  const deleteLivestream = async (id: string) => {
    await deleteDoc(doc(db, "livestreams", id));
    fetchLivestreams();
  };

  const handleThumbnailUpload = async (file: File | null) => {
    if (!file) return null;
    const storageRef = ref(storage, `thumbnails/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };
  

  const updateLivestream = async (id: string, updatedData: any) => {
    try {
      await updateDoc(doc(db, "livestreams", id), updatedData);
      alert("Livestream updated!");
      setEditingId(null);
      fetchLivestreams();
    } catch (err) {
      console.error(err);
      alert("Failed to update livestream.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Livestreams</h1>

{/* ✅ Improved "Add Livestream" Form */}
<div className="p-4 bg-gray-800 rounded-lg mb-8">
  <h2 className="text-xl font-semibold mb-4">Add Livestream</h2>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input
      className="p-2 bg-gray-700 rounded"
      placeholder="Title"
      value={newLivestream.title}
      onChange={(e) => setNewLivestream({ ...newLivestream, title: e.target.value })}
    />

    <textarea
      className="p-2 bg-gray-700 rounded"
      placeholder="Description"
      value={newLivestream.description}
      onChange={(e) => setNewLivestream({ ...newLivestream, description: e.target.value })}
    />

    

    <select
      className="p-2 bg-gray-700 rounded"
      value={newLivestream.type}
      onChange={(e) => setNewLivestream({ ...newLivestream, type: e.target.value })}
    >
      <option value="upload">Upload Video File</option>
      <option value="link">YouTube/Vimeo Link</option>
      <option value="iframe">Iframe Embed Link</option>
    </select>

    {newLivestream.type === "upload" && (
      <input
        type="file"
        className="p-2 bg-gray-700 rounded"
        onChange={(e) => setNewLivestream({ ...newLivestream, videoFile: e.target.files?.[0] || null })}
      />
    )}

    {(newLivestream.type === "link" || newLivestream.type === "iframe") && (
      <input
        className="p-2 bg-gray-700 rounded"
        placeholder="Video URL or iframe embed link"
        value={newLivestream.videoURL}
        onChange={(e) => setNewLivestream({ ...newLivestream, videoURL: e.target.value })}
      />
    )}

    <input
      type="file"
      accept="image/*"
      className="p-2 bg-gray-700 rounded"
      onChange={(e) => setNewLivestream({ ...newLivestream, thumbnailFile: e.target.files?.[0] || null })}
    />

    <select
      className="p-2 bg-gray-700 rounded"
      value={newLivestream.status}
      onChange={(e) => setNewLivestream({ ...newLivestream, status: e.target.value })}
    >
      <option value="live">Live</option>
      <option value="offline">Offline</option>
      <option value="scheduled">Scheduled</option>
    </select>
    

    {newLivestream.status === "scheduled" && (
      <input
        type="datetime-local"
        className="p-2 bg-gray-700 rounded"
        value={newLivestream.scheduleDate}
        onChange={(e) => setNewLivestream({ ...newLivestream, scheduleDate: e.target.value })}
      />
    )}

    <input
      type="datetime-local"
      className="p-2 bg-gray-700 rounded"
      value={newLivestream.startTime}
      onChange={(e) => setNewLivestream({ ...newLivestream, startTime: e.target.value })}
    />

    <input
      type="datetime-local"
      className="p-2 bg-gray-700 rounded"
      value={newLivestream.endTime}
      onChange={(e) => setNewLivestream({ ...newLivestream, endTime: e.target.value })}
    />
  </div>

  <button
    onClick={addLivestream}
    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg flex items-center"
  >
    {uploading ? "Uploading..." : <><UploadCloud className="mr-2" /> Upload & Save</>}
  </button>
</div>


     {/* ✅ Livestream Cards */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {livestreams.map((ls) => (
        <div key={ls.id}>
          {editingId === ls.id ? (
  <div>
    {/* Title Input */}
    <input
      type="text"
      value={ls.title}
      onChange={(e) =>
        setLivestreams((prevLivestreams) =>
          prevLivestreams.map((stream) =>
            stream.id === ls.id ? { ...stream, title: e.target.value } : stream
          )
        )
      }
      className="p-2 bg-gray-700 rounded w-full mb-2"
      placeholder="Edit Title"
    />

    {/* Description Input */}
    <textarea
      value={ls.description}
      onChange={(e) =>
        setLivestreams((prevLivestreams) =>
          prevLivestreams.map((stream) =>
            stream.id === ls.id ? { ...stream, description: e.target.value } : stream
          )
        )
      }
      className="p-2 bg-gray-700 rounded w-full mb-2"
      placeholder="Edit Description"
    />

    {/* Status Dropdown */}
    <select
      value={ls.status}
      onChange={(e) =>
        setLivestreams((prevLivestreams) =>
          prevLivestreams.map((stream) =>
            stream.id === ls.id ? { ...stream, status: e.target.value } : stream
          )
        )
      }
      className="p-2 bg-gray-700 rounded w-full mb-2"
    >
      <option value="live">Live</option>
      <option value="offline">Offline</option>
      <option value="scheduled">Scheduled</option>
    </select>

    {/* Scheduled Date Input */}
    {ls.status === "scheduled" && (
      <input
        type="datetime-local"
        value={ls.scheduleDate ? new Date(ls.scheduleDate).toISOString().slice(0, 16) : ""}
        onChange={(e) =>
          setLivestreams((prevLivestreams) =>
            prevLivestreams.map((stream) =>
              stream.id === ls.id ? { ...stream, scheduleDate: e.target.value } : stream
            )
          )
        }
        className="p-2 bg-gray-700 rounded w-full mb-2"
      />
    )}

    {/* Start Time Input */}
    <input
      type="datetime-local"
      value={ls.startTime ? new Date(ls.startTime).toISOString().slice(0, 16) : ""}
      onChange={(e) =>
        setLivestreams((prevLivestreams) =>
          prevLivestreams.map((stream) =>
            stream.id === ls.id ? { ...stream, startTime: e.target.value } : stream
          )
        )
      }
      className="p-2 bg-gray-700 rounded w-full mb-2"
    />

    {/* End Time Input */}
    <input
      type="datetime-local"
      value={ls.endTime ? new Date(ls.endTime).toISOString().slice(0, 16) : ""}
      onChange={(e) =>
        setLivestreams((prevLivestreams) =>
          prevLivestreams.map((stream) =>
            stream.id === ls.id ? { ...stream, endTime: e.target.value } : stream
          )
        )
      }
      className="p-2 bg-gray-700 rounded w-full mb-2"
    />

    {/* Action Buttons */}
    <div className="flex gap-2 mt-2">
      <button
        onClick={() => updateLivestream(ls.id, ls)}
        className="text-green-500 font-semibold"
      >
        <Save size={20} /> Save
      </button>
      <button
        onClick={() => setEditingId(null)}
        className="text-gray-400 font-semibold"
      >
        Cancel
      </button>
    </div>
  </div>
) : (
  // Display mode here remains unchanged
  <div className="p-4 bg-gray-800 rounded-lg shadow-md">
    <div className="relative">
      {ls.thumbnailURL && (
        <img
          src={ls.thumbnailURL}
          alt="Thumbnail"
          className="w-full h-48 object-cover rounded"
        />
      )}
      <span
        className={`absolute top-2 left-2 px-2 py-1 text-xs rounded-full ${
          ls.status === "live"
            ? "bg-green-600"
            : ls.status === "offline"
            ? "bg-gray-600"
            : "bg-yellow-500"
        }`}
      >
        {ls.status.toUpperCase()}
      </span>
    </div>
    <h3 className="text-xl font-semibold mt-2 text-white">{ls.title}</h3>
    <p className="text-gray-300">{ls.description}</p>
    <div className="flex gap-2 mt-2">
      <button onClick={() => setEditingId(ls.id)} className="text-blue-400">
        <Pencil size={20} />
      </button>
      <button onClick={() => deleteLivestream(ls.id)} className="text-red-500">
        <Trash2 size={20} />
      </button>
    </div>
  </div>
)}
</div>
))}
</div>


      {/* Chat */}
      {selectedLivestream && (
        <div className="mt-10">
          <ChatBox livestreamId={selectedLivestream} />
        </div>
      )}
    </div>
  );
}
