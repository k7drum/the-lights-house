"use client";
import React, { useEffect, useState, ChangeEvent } from "react";
import { db, auth, storage } from "@/config/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { Trash2, Plus, Edit } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  content: string;
  fileUrl?: string;
}

interface SermonForm {
  title: string;
  speaker: string;
  date: string;
  content: string;
  fileUrl?: string;
}

export default function SermonNotesPage() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [form, setForm] = useState<SermonForm>({
    title: "",
    speaker: "",
    date: "",
    content: "",
    fileUrl: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  // Load sermons on mount
  useEffect(() => {
    fetchSermons();
  }, []);

  const fetchSermons = async () => {
    try {
      const snap = await getDocs(collection(db, "sermons"));
      const list: Sermon[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Sermon, "id">),
      }));
      setSermons(list);
    } catch (err) {
      console.error("Error fetching sermons:", err);
      setError("Failed to fetch sermons. Check permissions.");
    }
  };

  const handleChange =
    (field: keyof SermonForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const storageRef = ref(storage, `sermons/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, fileUrl: url }));
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Failed to upload file.");
    }
  };

  const addOrUpdateSermon = async () => {
    const { title, speaker, date, content } = form;
    if (!title || !speaker || !date || !content) {
      setError("All fields are required.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in.");
      return;
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, "sermons", editingId), {
          ...form,
          updatedAt: new Date(),
        });
      } else {
        await addDoc(collection(db, "sermons"), {
          ...form,
          createdAt: new Date(),
          createdBy: user.uid,
        });
      }
      setForm({ title: "", speaker: "", date: "", content: "", fileUrl: "" });
      setEditingId(null);
      setError("");
      fetchSermons();
    } catch (err: any) {
      console.error("Firestore error:", err);
      setError("Error: " + err.message);
    }
  };

  const startEdit = (sermon: Sermon) => {
    setEditingId(sermon.id);
    setForm({
      title: sermon.title,
      speaker: sermon.speaker,
      date: sermon.date,
      content: sermon.content,
      fileUrl: sermon.fileUrl,
    });
    setError("");
  };

  const deleteSermon = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sermon?")) return;
    try {
      await deleteDoc(doc(db, "sermons", id));
      fetchSermons();
    } catch (err) {
      console.error("Error deleting sermon:", err);
      setError("Failed to delete sermon.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Sermon Notes</h1>
      {error && <p className="text-red-500 my-2">{error}</p>}

      {/* Add/Edit Sermon Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">
          {editingId ? "Edit Sermon" : "Add New Sermon"}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={handleChange("title")}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Speaker"
            value={form.speaker}
            onChange={handleChange("speaker")}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="date"
            value={form.date}
            onChange={handleChange("date")}
            className="p-2 bg-gray-700 rounded"
          />
        </div>
        <textarea
          placeholder="Sermon Content"
          value={form.content}
          onChange={handleChange("content")}
          className="w-full p-2 bg-gray-700 rounded mt-2 h-40"
        />
        <input
          type="file"
          onChange={handleFileUpload}
          className="mt-2 text-sm"
        />
        <button
          onClick={addOrUpdateSermon}
          className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center"
        >
          <Plus className="mr-2" />
          {editingId ? "Update Sermon" : "Add Sermon"}
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
            {sermons.map((s) => (
              <tr key={s.id}>
                <td className="p-2">{s.title}</td>
                <td className="p-2">{s.speaker}</td>
                <td className="p-2">{s.date}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-yellow-400"
                  >
                    <Edit />
                  </button>
                  <button
                    onClick={() => deleteSermon(s.id)}
                    className="text-red-500"
                  >
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
