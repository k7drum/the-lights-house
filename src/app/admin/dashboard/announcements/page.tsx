"use client";
import { useState, useEffect } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Save, Edit, Trash2, ArrowLeft, RefreshCw } from "lucide-react";

// ✅ Define the type
type Announcement = {
  id: string;
  title: string;
  message: string;
  expiryDate: { seconds: number; nanoseconds: number };
  targetAudience: string;
  status: string;
  createdAt: any;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [expiredAnnouncements, setExpiredAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const q = query(collection(db, "announcements"), orderBy("expiryDate", "desc"));
      const querySnapshot = await getDocs(q);
      const now = new Date();

      const allAnnouncements: Announcement[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Announcement[];

      setAnnouncements(allAnnouncements);
      setExpiredAnnouncements(allAnnouncements.filter((ann) => new Date(ann.expiryDate.seconds * 1000) <= now));
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const saveAnnouncement = async () => {
    if (!title || !message || !expiryDate) {
      alert("All fields are required!");
      return;
    }

    try {
      setLoading(true);
      const announcementData = {
        title,
        message,
        expiryDate: Timestamp.fromDate(new Date(expiryDate)),
        targetAudience,
        status,
        createdAt: Timestamp.now(),
      };

      if (editingId) {
        await updateDoc(doc(db, "announcements", editingId), announcementData);
        alert("Announcement updated successfully!");
      } else {
        await addDoc(collection(db, "announcements"), announcementData);
        alert("Announcement created successfully!");
      }

      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, "announcements", id));
      alert("Announcement deleted successfully!");
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
    }
  };

  const editAnnouncement = (announcement: Announcement) => {
    setTitle(announcement.title);
    setMessage(announcement.message);
    setExpiryDate(new Date(announcement.expiryDate.seconds * 1000).toISOString().split("T")[0]);
    setTargetAudience(announcement.targetAudience);
    setStatus(announcement.status);
    setEditingId(announcement.id);
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setExpiryDate("");
    setTargetAudience("all");
    setStatus("draft");
    setEditingId(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <button onClick={() => router.back()} className="flex items-center text-gray-400 hover:text-white">
          <ArrowLeft className="mr-2" /> Back
        </button>
        <button onClick={fetchAnnouncements} className="flex items-center bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600">
          <RefreshCw size={18} className="mr-2" /> Refresh
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-4">Announcements</h1>

      <div className="bg-gray-800 p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-2">{editingId ? "Edit Announcement" : "New Announcement"}</h2>

        <label className="block text-gray-400">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="p-2 bg-gray-700 rounded w-full mb-2" />

        <label className="block text-gray-400">Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="p-2 bg-gray-700 rounded w-full h-24 mb-2"></textarea>

        <label className="block text-gray-400">Expiry Date</label>
        <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="p-2 bg-gray-700 rounded w-full mb-2" />

        <button onClick={saveAnnouncement} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center">
          <Save className="mr-2" /> {loading ? "Saving..." : editingId ? "Update Announcement" : "Create Announcement"}
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Active Announcements</h2>
      <div className="space-y-2">
        {announcements.length === 0 ? (
          <p className="text-gray-400 text-center">No active announcements.</p>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{ann.title}</h3>
                <p className="text-gray-300">{ann.message}</p>
                <p className="text-gray-400 text-sm">Expires: {new Date(ann.expiryDate.seconds * 1000).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => editAnnouncement(ann)} className="bg-blue-500 p-2 rounded text-white">
                  <Edit size={16} />
                </button>
                <button onClick={() => deleteAnnouncement(ann.id)} className="bg-red-500 p-2 rounded text-white">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
