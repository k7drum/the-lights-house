"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { Save } from "lucide-react";

export default function AnnouncementEditor() {
  const [announcement, setAnnouncement] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    const docRef = doc(db, "settings", "announcement");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setAnnouncement(docSnap.data().message);
    } else {
      setAnnouncement("");
    }
  };

  const saveAnnouncement = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "announcement"), { message: announcement });
      alert("Announcement updated successfully!");
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Failed to save announcement.");
    }
    setSaving(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Announcement</h1>
      <textarea
        value={announcement}
        onChange={(e) => setAnnouncement(e.target.value)}
        className="w-full p-4 bg-gray-800 text-white rounded-lg"
        rows={3}
        placeholder="Enter announcement text..."
      />
      <button 
        onClick={saveAnnouncement}
        className="mt-4 px-6 py-2 bg-green-500 text-white rounded flex items-center"
        disabled={saving}
      >
        {saving ? "Saving..." : <><Save className="mr-2" /> Save Announcement</>}
      </button>
    </div>
  );
}
