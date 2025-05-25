// src/app/admin/dashboard/livestreams/page.tsx
"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { db, storage } from "@/config/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Trash2, UploadCloud, Pencil, X } from "lucide-react";
import dayjs from "dayjs";
import ChatBox from "@/components/livestream/ChatBox";

// ─── TYPES ────────────────────────────────────────────────────────────────
interface SermonNote { id: string; title: string }
type LiveStatus = "scheduled" | "live" | "offline";

interface LivestreamRecord {
  id: string;
  title: string;
  description: string;
  type: "upload" | "link" | "iframe";
  videoURL: string;
  thumbnailURL: string;
  status: LiveStatus;
  scheduleDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  preacher: string;
  songs: string[];
  activities: string[];
  sermonNoteId: string;
}

interface FormData {
  title: string;
  description: string;
  type: "upload" | "link" | "iframe";
  videoFile: File | null;
  videoURL: string;
  thumbnailFile: File | null;
  thumbnailURL: string;
  status: LiveStatus;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  preacher: string;
  songs: string;
  activities: string;
  sermonNoteId: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────
function computeStatus(ls: LivestreamRecord): LiveStatus {
  if (ls.status !== "scheduled") return ls.status;
  if (!ls.startTime || !ls.endTime) return "scheduled";
  const now = dayjs();
  if (now.isBefore(ls.startTime)) return "scheduled";
  if (now.isAfter(ls.endTime))    return "offline";
  return "live";
}

async function uploadFile(path: string, file: File): Promise<string> {
  const r = ref(storage, `${path}/${file.name}`);
  const snap = await uploadBytes(r, file);
  return getDownloadURL(snap.ref);
}

// ─── LIVESTREAMS PAGE ─────────────────────────────────────────────────────
export default function LivestreamsPage() {
  const [livestreams, setLivestreams] = useState<LivestreamRecord[]>([]);
  const [sermonNotes, setSermonNotes]   = useState<SermonNote[]>([]);
  const [adding, setAdding]             = useState(false);

  const [newData, setNewData] = useState<FormData>({
    title: "", description: "", type: "upload", videoFile: null, videoURL: "",
    thumbnailFile: null, thumbnailURL: "", status: "scheduled",
    scheduleDate:"", startTime:"", endTime:"",
    preacher:"", songs:"", activities:"", sermonNoteId:"",
  });

  const [editData, setEditData] = useState<FormData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ─── FETCH ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSermonNotes();
    fetchLivestreams();
  }, []);

  async function fetchSermonNotes() {
    const snap = await getDocs(collection(db, "sermons"));
    setSermonNotes(snap.docs.map(d => ({
      id: d.id,
      title: (d.data().title as string) || "Untitled"
    })));
  }

  async function fetchLivestreams() {
    const snap = await getDocs(collection(db, "livestreams"));
    setLivestreams(snap.docs.map(d => {
      const data: any = d.data();
      return {
        id: d.id,
        title:        data.title        || "",
        description:  data.description  || "",
        type:         data.type         || "link",
        videoURL:     data.videoURL     || "",
        thumbnailURL: data.thumbnailURL || "",
        status:       data.status       || "scheduled",
        scheduleDate: data.scheduleDate ? (data.scheduleDate as Timestamp).toDate() : null,
        startTime:    data.startTime    ? (data.startTime    as Timestamp).toDate() : null,
        endTime:      data.endTime      ? (data.endTime      as Timestamp).toDate() : null,
        preacher:     data.preacher     || "",
        songs:        data.songs        || [],
        activities:   data.activities   || [],
        sermonNoteId: data.sermonNoteId || "",
      } as LivestreamRecord;
    }));
  }

  // ─── COMMON CHANGE HANDLERS ─────────────────────────────────────────────
  const onFormChange = (setter: React.Dispatch<React.SetStateAction<FormData>>, data: FormData) =>
    (field: keyof FormData) =>
      (e: ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
        const val =
          field==="videoFile"||field==="thumbnailFile"
            ? (e.target as HTMLInputElement).files?.[0] ?? null
            : e.target.value;
        setter({ ...data, [field]: val });
      };

  // ─── ADD ─────────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!newData.title || !newData.description || !newData.sermonNoteId) {
      alert("Title, description & sermon note are required");
      return;
    }
    setAdding(true);
    try {
      let videoURL = newData.videoURL;
      if (newData.type==="upload"&&newData.videoFile)
        videoURL = await uploadFile("livestreams", newData.videoFile);

      let thumbnailURL = newData.thumbnailURL;
      if (newData.thumbnailFile)
        thumbnailURL = await uploadFile("thumbnails", newData.thumbnailFile);

      const schedTS = newData.status==="scheduled"&&newData.scheduleDate
        ? Timestamp.fromDate(new Date(newData.scheduleDate))
        : null;
      const startTS = schedTS&&newData.startTime
        ? Timestamp.fromDate(new Date(`${newData.scheduleDate}T${newData.startTime}`))
        : null;
      const endTS = schedTS&&newData.endTime
        ? Timestamp.fromDate(new Date(`${newData.scheduleDate}T${newData.endTime}`))
        : null;

      await addDoc(collection(db,"livestreams"), {
        title: newData.title,
        description: newData.description,
        type: newData.type,
        videoURL, thumbnailURL,
        status: newData.status,
        scheduleDate: schedTS, startTime: startTS, endTime: endTS,
        preacher: newData.preacher,
        songs: newData.songs.split(",").map(s=>s.trim()),
        activities: newData.activities.split(",").map(a=>a.trim()),
        sermonNoteId: newData.sermonNoteId,
        createdAt: Timestamp.now(),
      });
      setNewData({
        title:"",description:"",type:"upload",videoFile:null,videoURL:"",
        thumbnailFile:null,thumbnailURL:"",
        status:"scheduled",scheduleDate:"",startTime:"",endTime:"",
        preacher:"",songs:"",activities:"",sermonNoteId:"",
      });
      await fetchLivestreams();
    } catch(err) {
      console.error(err); alert("Add failed");
    } finally {
      setAdding(false);
    }
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────
  async function handleDelete(id:string) {
    await deleteDoc(doc(db,"livestreams",id));
    await fetchLivestreams();
  }

  // ─── EDIT MODAL ──────────────────────────────────────────────────────────
  function openEdit(ls:LivestreamRecord) {
    setEditingId(ls.id);
    setEditData({
      title: ls.title,
      description: ls.description,
      type: ls.type,
      videoFile: null,
      videoURL: ls.videoURL,
      thumbnailFile: null,
      thumbnailURL: ls.thumbnailURL,
      status: ls.status,
      scheduleDate: ls.scheduleDate ? dayjs(ls.scheduleDate).format("YYYY-MM-DD") : "",
      startTime:    ls.startTime    ? dayjs(ls.startTime).format("HH:mm") : "",
      endTime:      ls.endTime      ? dayjs(ls.endTime).format("HH:mm") : "",
      preacher: ls.preacher,
      songs: ls.songs.join(", "),
      activities: ls.activities.join(", "),
      sermonNoteId: ls.sermonNoteId,
    });
  }

  async function saveEdit() {
    if (!editData || !editingId) return;
    const id = editingId;
    const d = editData;
    const schedTS = d.status==="scheduled"&&d.scheduleDate
      ? Timestamp.fromDate(new Date(d.scheduleDate))
      : null;
    const startTS = schedTS&&d.startTime
      ? Timestamp.fromDate(new Date(`${d.scheduleDate}T${d.startTime}`))
      : null;
    const endTS = schedTS&&d.endTime
      ? Timestamp.fromDate(new Date(`${d.scheduleDate}T${d.endTime}`))
      : null;

    let videoURL = d.videoURL;
    if (d.type==="upload"&&d.videoFile)
      videoURL = await uploadFile("livestreams",d.videoFile);

    let thumbnailURL = d.thumbnailURL;
    if (d.thumbnailFile)
      thumbnailURL = await uploadFile("thumbnails",d.thumbnailFile);

    await updateDoc(doc(db,"livestreams",id), {
      title: d.title,
      description: d.description,
      type: d.type,
      videoURL, thumbnailURL,
      status: d.status,
      scheduleDate: schedTS,
      startTime: startTS, endTime: endTS,
      preacher: d.preacher,
      songs: d.songs.split(",").map(s=>s.trim()),
      activities: d.activities.split(",").map(a=>a.trim()),
      sermonNoteId: d.sermonNoteId,
    });

    setEditingId(null);
    setEditData(null);
    await fetchLivestreams();
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Livestreams</h1>

      {/* ─ Add Form ─ */}
      <div className="bg-gray-800 p-4 rounded-lg space-y-4">
        <h2 className="text-xl font-semibold">New Livestream</h2>
        <LivestreamForm
          data={newData}
          notes={sermonNotes}
          onChange={onFormChange(setNewData,newData)}
          onSubmit={handleAdd}
          submitting={adding}
        />
      </div>

      {/* ─ List ─ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {livestreams.map(ls => {
          const status = computeStatus(ls);
          return (
            <div key={ls.id} className="bg-gray-800 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg">{ls.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  status==="live" ? "bg-green-600"
                  : status==="scheduled" ? "bg-yellow-500"
                  : "bg-gray-600"
                }`}>
                  {status.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-300">{ls.description}</p>
              {ls.scheduleDate && <p className="text-sm text-gray-400">
                Scheduled: {dayjs(ls.scheduleDate).format("MMM D, YYYY")}
              </p>}
              <p className="text-sm text-gray-400">
                Starts: {ls.startTime ? dayjs(ls.startTime).format("h:mm A") : "—"}
              </p>
              <p className="text-sm text-gray-400">
                Ends: {ls.endTime ? dayjs(ls.endTime).format("h:mm A") : "—"}
              </p>
              <p className="text-sm text-gray-400">Preacher: {ls.preacher}</p>
              <p className="text-sm text-gray-400">Songs: {ls.songs.join(", ")}</p>
              <p className="text-sm text-gray-400">
                Activities: {ls.activities.join(", ")}
              </p>
              <p className="text-sm text-gray-400">
                Sermon Note: {sermonNotes.find(n=>n.id===ls.sermonNoteId)?.title||"—"}
              </p>
              <div className="flex space-x-4 mt-2">
                <button onClick={()=> openEdit(ls)} className="text-blue-400">
                  <Pencil />
                </button>
                <button onClick={()=> handleDelete(ls.id)} className="text-red-500">
                  <Trash2 />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─ Edit Modal ─ */}
      {editingId && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 w-full max-w-3xl rounded-lg space-y-4 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Livestream</h2>
              <button onClick={()=>setEditingId(null)}><X /></button>
            </div>
            <LivestreamForm
              data={editData}
              notes={sermonNotes}
              onChange={onFormChange(setEditData,editData)}
              onSubmit={saveEdit}
              submitting={false}
            />
          </div>
        </div>
      )}

      {/* ─ Chat for first livestream ─ */}
      {livestreams[0] && (
        <div className="mt-8">
          <ChatBox livestreamId={livestreams[0].id} />
        </div>
      )}
    </div>
  );
}

// ─── REUSABLE FORM ─────────────────────────────────────────────────────────
function LivestreamForm({
  data,
  notes,
  onChange,
  onSubmit,
  submitting,
}: {
  data: FormData;
  notes: SermonNote[];
  onChange: (field: keyof FormData) => any;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input value={data.title}        onChange={onChange("title")}
        className="bg-gray-700 p-2 rounded" placeholder="Title" />

      <textarea value={data.description} onChange={onChange("description")}
        className="bg-gray-700 p-2 rounded" placeholder="Description" />

      <select value={data.type} onChange={onChange("type")}
        className="bg-gray-700 p-2 rounded w-full">
        <option value="upload">Upload Video File</option>
        <option value="link">External Link</option>
        <option value="iframe">Embed Iframe</option>
      </select>

      {data.type==="upload" ? (
        <input type="file" onChange={onChange("videoFile")}
          className="bg-gray-700 p-2 rounded w-full" />
      ) : (
        <input value={data.videoURL} onChange={onChange("videoURL")}
          className="bg-gray-700 p-2 rounded w-full"
          placeholder="Video URL / Iframe code" />
      )}

      <input type="file" onChange={onChange("thumbnailFile")}
        className="bg-gray-700 p-2 rounded w-full" />

      <select value={data.status} onChange={onChange("status")}
        className="bg-gray-700 p-2 rounded w-full">
        <option value="scheduled">Scheduled</option>
        <option value="live">Force Live</option>
        <option value="offline">Force Offline</option>
      </select>

      {data.status==="scheduled" && (
        <input type="date" value={data.scheduleDate}
          onChange={onChange("scheduleDate")}
          className="bg-gray-700 p-2 rounded w-full" />
      )}

      <input type="time" value={data.startTime}
        onChange={onChange("startTime")}
        className="bg-gray-700 p-2 rounded w-full" />

      <input type="time" value={data.endTime}
        onChange={onChange("endTime")}
        className="bg-gray-700 p-2 rounded w-full" />

      <input value={data.preacher} onChange={onChange("preacher")}
        className="bg-gray-700 p-2 rounded w-full" placeholder="Preacher" />

      <input value={data.songs} onChange={onChange("songs")}
        className="bg-gray-700 p-2 rounded w-full"
        placeholder="Songs (comma-separated)" />

      <input value={data.activities} onChange={onChange("activities")}
        className="bg-gray-700 p-2 rounded w-full"
        placeholder="Activities (comma-separated)" />

      <select value={data.sermonNoteId} onChange={onChange("sermonNoteId")}
        className="bg-gray-700 p-2 rounded w-full">
        <option value="">— Select Sermon Note —</option>
        {notes.map(n=>(
          <option key={n.id} value={n.id}>{n.title}</option>
        ))}
      </select>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="col-span-1 md:col-span-2 bg-red-600 px-4 py-2 rounded-lg flex items-center justify-center mt-2"
      >
        {submitting
          ? "Saving…"
          : <><UploadCloud className="mr-2"/> Save</>}
      </button>
    </div>
  );
}
