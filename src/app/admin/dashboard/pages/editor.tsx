"use client";
import React, { useEffect, useState, ChangeEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/config/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
// Import a default cell plugin for the editor
import slate from "@react-page/plugins-slate";
import "@react-page/plugins-slate/lib/index.css";

// Dynamically import the React Page Builder
const Editor = dynamic(() => import("@react-page/editor"), { ssr: false });

export default function PageEditor() {
  const router = useRouter();
  const params = useParams() as { id?: string | string[] };
  const rawId = params.id;
  const pageId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<any>(null);

  // Initialize the cellPlugins array
  const cellPlugins = [slate()];

  useEffect(() => {
    if (pageId) {
      fetchPage();
    }
  }, [pageId]);

  // Load existing page if editing
  const fetchPage = async () => {
    setLoading(true);
    try {
      if (!pageId) return;
      const pageRef = doc(db, "pages", pageId);
      const snap = await getDoc(pageRef);
      if (snap.exists()) {
        // Expecting stored content under "content" field
        setContent(snap.data().content);
      } else {
        setContent(null);
      }
    } catch (err) {
      console.error("Error fetching page:", err);
    } finally {
      setLoading(false);
    }
  };

  // Save (or create) the page
  const savePage = async () => {
    setLoading(true);
    try {
      if (pageId) {
        // Update existing
        await setDoc(
          doc(db, "pages", pageId),
          { content },
          { merge: true }
        );
      } else {
        // Create new
        await addDoc(collection(db, "pages"), {
          content,
          createdAt: new Date(),
        });
      }
      alert("Page saved successfully!");
      router.push("/admin/dashboard/pages");
    } catch (err) {
      console.error("Error saving page:", err);
      alert("Failed to save page.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Link href="/admin/dashboard/pages">
          <button className="px-4 py-2 bg-gray-500 text-white rounded flex items-center">
            <ArrowLeft className="mr-2" /> Back to Pages
          </button>
        </Link>
        <h1 className="text-2xl font-bold">
          {pageId ? "Edit Page" : "Create New Page"}
        </h1>
      </div>

      {loading ? (
        <p>Loading page...</p>
      ) : (
        <>
          <Editor
            value={content}
            onChange={setContent}
            cellPlugins={cellPlugins}
          />
          <button
            onClick={savePage}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded flex items-center"
          >
            <Save className="mr-2" /> {loading ? "Saving..." : "Save Page"}
          </button>
        </>
      )}
    </div>
  );
}
