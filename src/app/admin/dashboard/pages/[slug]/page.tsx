"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import dynamic from "next/dynamic";

// Import React Page Renderer (Same Library Used in Admin)
const EditorRenderer = dynamic(() => import("@react-page/editor"), { ssr: false });

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPage();
    }
  }, [slug]);

  const fetchPage = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "pages", slug);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPage(docSnap.data());
      } else {
        setPage(null);
      }
    } catch (error) {
      console.error("Error fetching page:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      {loading ? (
        <p className="text-gray-500">Loading page...</p>
      ) : page ? (
        <>
          <h1 className="text-3xl font-bold mb-4">{page.title}</h1>
          <EditorRenderer value={page.content} />
        </>
      ) : (
        <p className="text-red-500 text-center">Page not found!</p>
      )}
    </div>
  );
}
