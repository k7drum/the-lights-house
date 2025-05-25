"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { db, storage } from "@/config/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Trash2, UploadCloud, CalendarClock } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageURL: string;
  eventURL?: string;
  status: "Active" | "Inactive";
}

interface NewEvent {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageFile: File | null;
  imageURL: string;
  eventURL: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [newEvent, setNewEvent] = useState<NewEvent>({
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

  // Fetch existing events from Firestore
  const fetchEvents = async () => {
    try {
      const snap = await getDocs(collection(db, "events"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<EventItem, "id">),
      }));
      setEvents(list);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  // Upload an image; always returns a string (empty if upload failed or no file)
  const handleImageUpload = async (file: File | null): Promise<string> => {
    if (!file) return "";
    try {
      const storageRef = ref(storage, `events/${file.name}`);
      const snap = await uploadBytes(storageRef, file);
      return await getDownloadURL(snap.ref);
    } catch (err) {
      console.error("Error uploading image:", err);
      return "";
    }
  };

  // Create or update an event
  const saveEvent = async () => {
    if (
      !newEvent.title ||
      !newEvent.description ||
      !newEvent.startDate ||
      !newEvent.endDate
    ) {
      alert("Please fill all required fields!");
      return;
    }

    setUploading(true);
    try {
      // always a string now
      let imageURL = newEvent.imageURL;

      if (newEvent.imageFile) {
        const uploadedUrl = await handleImageUpload(newEvent.imageFile);
        if (!uploadedUrl) throw new Error("Image upload failed");
        imageURL = uploadedUrl;
      }

      const status =
        new Date(newEvent.endDate) > new Date() ? "Active" : "Inactive";

      if (editingEvent) {
        await updateDoc(doc(db, "events", editingEvent.id), {
          title: newEvent.title,
          description: newEvent.description,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          imageURL,
          eventURL: newEvent.eventURL,
          status,
        });
      } else {
        await addDoc(collection(db, "events"), {
          title: newEvent.title,
          description: newEvent.description,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          imageURL,
          eventURL: newEvent.eventURL,
          status,
          createdAt: new Date(),
        });
      }

      // reset
      setNewEvent({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        imageFile: null,
        imageURL: "",
        eventURL: "",
      });
      setEditingEvent(null);
      fetchEvents();
      alert("Event saved successfully!");
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Failed to save event.");
    } finally {
      setUploading(false);
    }
  };

  // Load event into form for editing
  const editEvent = (ev: EventItem) => {
    setEditingEvent(ev);
    setNewEvent({
      title: ev.title,
      description: ev.description,
      startDate: ev.startDate,
      endDate: ev.endDate,
      imageFile: null,
      imageURL: ev.imageURL,
      eventURL: ev.eventURL || "",
    });
  };

  // Remove an event
  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, "events", id));
      fetchEvents();
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  // Generic input change
  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value } as NewEvent);
  };

  // File input change
  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    setNewEvent({
      ...newEvent,
      imageFile: e.target.files?.[0] ?? null,
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Events</h1>

      {/* Add / Edit Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">
          {editingEvent ? "Edit Event" : "Add New Event"}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            name="title"
            type="text"
            placeholder="Title"
            value={newEvent.title}
            onChange={handleChange}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            name="description"
            type="text"
            placeholder="Description"
            value={newEvent.description}
            onChange={handleChange}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            name="startDate"
            type="datetime-local"
            value={newEvent.startDate}
            onChange={handleChange}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            name="endDate"
            type="datetime-local"
            value={newEvent.endDate}
            onChange={handleChange}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            name="eventURL"
            type="text"
            placeholder="External Event URL (Optional)"
            value={newEvent.eventURL}
            onChange={handleChange}
            className="p-2 bg-gray-700 rounded"
          />
        </div>
        <button
          onClick={saveEvent}
          disabled={uploading}
          className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center"
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <UploadCloud className="mr-2" />
              {editingEvent ? "Update Event" : "Upload & Save"}
            </>
          )}
        </button>
      </div>

      {/* Events List */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">All Events</h2>
        {events.map((ev) => (
          <div
            key={ev.id}
            className="bg-gray-900 p-4 rounded-lg mb-4"
          >
            <h3 className="text-lg font-bold">{ev.title}</h3>
            <p>{ev.description}</p>
            <p>
              <CalendarClock className="inline mr-1" />
              {new Date(ev.startDate).toLocaleString()} –{" "}
              {new Date(ev.endDate).toLocaleString()}
            </p>
            <p>Status: {ev.status}</p>
            <div className="mt-2 space-x-4">
              <button
                onClick={() => editEvent(ev)}
                className="text-blue-400"
              >
                Edit
              </button>
              <button
                onClick={() => deleteEvent(ev.id)}
                className="text-red-500"
              >
                <Trash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
