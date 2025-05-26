// src/app/admin/dashboard/pages/[slug]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";

// Dynamically import Editor (client-only)
const Editor = dynamic(
  () => import("@react-page/editor").then((mod) => mod.Editor),
  { ssr: false }
);

export default function DynamicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<{ title?: string; content?: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const ref = doc(db, "pages", slug);
      const snap = await getDoc(ref);
      setPage(snap.exists() ? (snap.data() as any) : null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="p-6 text-gray-500">Loading page…</div>
    );
  }

  if (!page) {
    return (
      <div className="p-6 text-red-500 text-center">Page not found!</div>
    );
  }

  return (
    <div className="p-6">
      {page.title && <h1 className="text-3xl font-bold mb-4">{page.title}</h1>}
      <div className="bg-white p-4 rounded-lg shadow">
        <Editor value={page.content} />
      </div>
    </div>
  );
}
