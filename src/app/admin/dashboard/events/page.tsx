"use client";
import { useState, useEffect } from "react";
import { db, storage } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Trash2, UploadCloud, CalendarClock } from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    imageFile: null,
    imageURL: "",
    eventURL: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  // ✅ Fetch Events from Firestore
  const fetchEvents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "events"));
      const eventList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEvents(eventList);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // ✅ Handle Image Upload
  const handleImageUpload = async (file: File | null) => {
    try {
      if (!file) return null;
      const storageRef = ref(storage, `events/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  // ✅ Add or Update Event
  const saveEvent = async () => {
    if (!newEvent.title || !newEvent.description || !newEvent.startDate || !newEvent.endDate) {
      alert("Please fill all required fields!");
      return;
    }

    setUploading(true);
    try {
      let imageURL = newEvent.imageURL;
      
      if (newEvent.imageFile) {
        imageURL = await handleImageUpload(newEvent.imageFile);
        if (!imageURL) throw new Error("Image upload failed");
      }

      if (editingEvent) {
        await updateDoc(doc(db, "events", editingEvent.id), {
          title: newEvent.title,
          description: newEvent.description,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          imageURL,
          eventURL: newEvent.eventURL,
          status: new Date(newEvent.endDate) > new Date() ? "Active" : "Inactive",
        });
      } else {
        await addDoc(collection(db, "events"), {
          title: newEvent.title,
          description: newEvent.description,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          imageURL,
          eventURL: newEvent.eventURL,
          status: new Date(newEvent.endDate) > new Date() ? "Active" : "Inactive",
          createdAt: new Date(),
        });
      }

      setNewEvent({ title: "", description: "", startDate: "", endDate: "", imageFile: null, imageURL: "", eventURL: "" });
      setEditingEvent(null);
      fetchEvents();
      alert("Event Saved Successfully!");
    } catch (error) {
      console.error("Error saving event:", error);
      alert("Failed to save event.");
    }
    setUploading(false);
  };

  // ✅ Edit Event
  const editEvent = (event: any) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      imageURL: event.imageURL,
      eventURL: event.eventURL,
      imageFile: null,
    });
  };

  // ✅ Delete Event
  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, "events", id));
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Events</h1>

      {/* Add or Edit Event Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">{editingEvent ? "Edit Event" : "Add New Event"}</h2>
        <div className="grid grid-cols-3 gap-4">
          <input type="text" placeholder="Title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="p-2 bg-gray-700 rounded" />
          <input type="text" placeholder="Description" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className="p-2 bg-gray-700 rounded" />
          <input type="datetime-local" value={newEvent.startDate} onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })} className="p-2 bg-gray-700 rounded" />
          <input type="datetime-local" value={newEvent.endDate} onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })} className="p-2 bg-gray-700 rounded" />
          <input type="file" accept="image/*" onChange={(e) => setNewEvent({ ...newEvent, imageFile: e.target.files?.[0] || null })} className="p-2 bg-gray-700 rounded" />
          <input type="text" placeholder="External Event URL (Optional)" value={newEvent.eventURL} onChange={(e) => setNewEvent({ ...newEvent, eventURL: e.target.value })} className="p-2 bg-gray-700 rounded" />
        </div>
        <button onClick={saveEvent} disabled={uploading} className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center">
          {uploading ? "Uploading..." : <><UploadCloud className="mr-2" /> {editingEvent ? "Update Event" : "Upload & Save"}</>}
        </button>
      </div>

      {/* Events List */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">All Events</h2>
        {events.map(event => (
          <div key={event.id} className="bg-gray-900 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-bold">{event.title}</h3>
            <p>{event.description}</p>
            <p>Status: {event.status}</p>
            <button onClick={() => editEvent(event)} className="text-blue-500">Edit</button>
            <button onClick={() => deleteEvent(event.id)} className="text-red-500 ml-4">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
