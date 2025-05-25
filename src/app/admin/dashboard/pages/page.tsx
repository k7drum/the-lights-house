"use client";
import React, { useEffect, useState, ChangeEvent } from "react";
import Link from "next/link";
import { db } from "@/config/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Pencil, Trash2, PlusCircle } from "lucide-react";

interface PageItem {
  id: string;
  title: string;
  slug: string;
}

export default function PagesManager() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newPage, setNewPage] = useState<{ title: string; slug: string }>({
    title: "",
    slug: "",
  });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "pages"));
      const list: PageItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PageItem, "id">),
      }));
      setPages(list);
    } catch (err) {
      console.error("Error fetching pages:", err);
    } finally {
      setLoading(false);
    }
  };

  const addPage = async () => {
    if (!newPage.title.trim() || !newPage.slug.trim()) {
      alert("Please enter both title and slug!");
      return;
    }
    try {
      // Add to pages collection
      const pageRef = await addDoc(collection(db, "pages"), {
        title: newPage.title.trim(),
        slug: newPage.slug.trim(),
      });

      // Ensure appears in menus
      const menusSnap = await getDocs(collection(db, "menus"));
      const exists = menusSnap.docs.some(
        (m) => m.data().name === newPage.title.trim()
      );
      if (!exists) {
        await addDoc(collection(db, "menus"), {
          name: newPage.title.trim(),
          path: `/pages/${newPage.slug.trim()}`,
          submenus: [],
          order: 99,
        });
      }

      setNewPage({ title: "", slug: "" });
      fetchPages();
      alert("Page created successfully!");
    } catch (err) {
      console.error("Error creating page:", err);
      alert("Failed to create page.");
    }
  };

  const deletePage = async (id: string, title: string) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      // Delete from pages
      await deleteDoc(doc(db, "pages", id));

      // Also remove from menus
      const menusSnap = await getDocs(collection(db, "menus"));
      const menuDoc = menusSnap.docs.find((m) => m.data().name === title);
      if (menuDoc) {
        await deleteDoc(doc(db, "menus", menuDoc.id));
      }

      setPages((prev) => prev.filter((p) => p.id !== id));
      alert("Page deleted.");
    } catch (err) {
      console.error("Error deleting page:", err);
      alert("Failed to delete page.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Pages Manager</h1>
      </div>

      {/* Add New Page */}
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Page Title"
          value={newPage.title}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNewPage((p) => ({ ...p, title: e.target.value }))
          }
          className="p-2 bg-gray-700 rounded w-1/2"
        />
        <input
          type="text"
          placeholder="Slug (e.g. about-us)"
          value={newPage.slug}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNewPage((p) => ({ ...p, slug: e.target.value }))
          }
          className="p-2 bg-gray-700 rounded w-1/2"
        />
        <button
          onClick={addPage}
          className="px-4 py-2 bg-blue-500 text-white rounded flex items-center"
        >
          <PlusCircle className="mr-2" /> Add Page
        </button>
      </div>

      {/* Page List */}
      {loading ? (
        <p className="text-gray-400">Loading pages...</p>
      ) : (
        <table className="w-full bg-gray-800 rounded-lg">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="p-3">Title</th>
              <th className="p-3">Slug (URL)</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.length > 0 ? (
              pages.map((page) => (
                <tr
                  key={page.id}
                  className="border-b border-gray-700 text-gray-300"
                >
                  <td className="p-3">{page.title}</td>
                  <td className="p-3">{page.slug}</td>
                  <td className="p-3 flex justify-center space-x-2">
                    <Link href={`/admin/dashboard/pages/edit/${page.id}`}>
                      <button className="text-blue-400">
                        <Pencil />
                      </button>
                    </Link>
                    <button
                      onClick={() => deletePage(page.id, page.title)}
                      className="text-red-500"
                    >
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="p-3 text-center text-gray-400"
                >
                  No pages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
