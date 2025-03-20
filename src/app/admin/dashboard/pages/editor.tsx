"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { db } from "@/config/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { Save } from "lucide-react";

// Dynamically import React Page Builder
const Editor = dynamic(() => import("@react-page/editor"), { ssr: false });

export default function PageEditor() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPage();
    }
  }, [id]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "pages", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setContent(docSnap.data().content);
      } else {
        setContent(null);
      }
    } catch (error) {
      console.error("Error fetching page:", error);
    }
    setLoading(false);
  };

  const savePage = async () => {
    try {
      setLoading(true);
      await setDoc(doc(db, "pages", id || "new-page"), { content });
      alert("Page saved successfully!");
      router.push("/admin/dashboard/pages");
    } catch (error) {
      console.error("Error saving page:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Page Editor</h1>
      {loading ? (
        <p>Loading page...</p>
      ) : (
        <>
          <Editor value={content} onChange={setContent} />
          <button
            onClick={savePage}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded flex items-center"
          >
            <Save className="mr-2" /> Save Page
          </button>
        </>
      )}
    </div>
  );
}
