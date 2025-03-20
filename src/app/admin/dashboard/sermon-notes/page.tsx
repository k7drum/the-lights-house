"use client";
import { useEffect, useState } from "react";
import { db, auth, storage } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { Trash2, Plus, Edit } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function SermonNotesPage() {
  const [sermons, setSermons] = useState([]);
  const [newSermon, setNewSermon] = useState({ title: "", speaker: "", date: "", content: "", fileUrl: "" });
  const [editingSermon, setEditingSermon] = useState(null); // Track sermon being edited
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSermons();
  }, []);

  const fetchSermons = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "sermons"));
      const sermonList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSermons(sermonList);
    } catch (err) {
      console.error("Error fetching sermons:", err);
      setError("Failed to fetch sermons. Check permissions.");
    }
  };

  const addOrUpdateSermon = async () => {
    if (!newSermon.title || !newSermon.speaker || !newSermon.date || !newSermon.content) {
      setError("All fields are required.");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in.");
        return;
      }

      if (editingSermon) {
        // Update existing sermon
        await updateDoc(doc(db, "sermons", editingSermon), {
          ...newSermon,
          updatedAt: new Date(),
        });
      } else {
        // Add new sermon
        await addDoc(collection(db, "sermons"), {
          ...newSermon,
          createdAt: new Date(),
          createdBy: user.uid,
        });
      }

      setNewSermon({ title: "", speaker: "", date: "", content: "", fileUrl: "" });
      setEditingSermon(null);
      fetchSermons(); // Refresh the list
      setError("");
    } catch (err) {
      console.error("Firestore error:", err);
      setError("Error: " + err.message);
    }
  };

  const deleteSermon = async (id) => {
    try {
      await deleteDoc(doc(db, "sermons", id));
      fetchSermons();
    } catch (err) {
      console.error("Error deleting sermon:", err);
      setError("Failed to delete sermon.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `sermons/${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);
      setNewSermon({ ...newSermon, fileUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload file.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Sermon Notes</h1>
      {error && <p className="text-red-500">{error}</p>}

      {/* Add/Edit Sermon Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">{editingSermon ? "Edit Sermon" : "Add New Sermon"}</h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Title"
            value={newSermon.title}
            onChange={(e) => setNewSermon({ ...newSermon, title: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Speaker"
            value={newSermon.speaker}
            onChange={(e) => setNewSermon({ ...newSermon, speaker: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="date"
            value={newSermon.date}
            onChange={(e) => setNewSermon({ ...newSermon, date: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
        </div>
        <textarea
          placeholder="Sermon Content"
          value={newSermon.content}
          onChange={(e) => setNewSermon({ ...newSermon, content: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded mt-2 h-40"
        ></textarea>
        <input type="file" onChange={handleFileUpload} className="mt-2 text-sm" />

        <button onClick={addOrUpdateSermon} className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center">
          <Plus className="mr-2" /> {editingSermon ? "Update Sermon" : "Add Sermon"}
        </button>
      </div>

      {/* Sermons List */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">All Sermons</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Speaker</th>
              <th className="p-2">Date</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sermons.map((sermon) => (
              <tr key={sermon.id}>
                <td className="p-2">{sermon.title}</td>
                <td className="p-2">{sermon.speaker}</td>
                <td className="p-2">{sermon.date}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => setEditingSermon(sermon.id) || setNewSermon(sermon)} className="text-yellow-400">
                    <Edit />
                  </button>
                  <button onClick={() => deleteSermon(sermon.id)} className="text-red-500">
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
