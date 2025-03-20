"use client";
import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function PagesManager() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPage, setNewPage] = useState({ title: "", slug: "" });

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pages"));
      const pageList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPages(pageList);
    } catch (error) {
      console.error("Error fetching pages:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add Page (Also Add to Menus)
  const addPage = async () => {
    if (!newPage.title || !newPage.slug) return alert("Please enter title and slug!");

    try {
      // Add new page to Firestore
      const pageRef = await addDoc(collection(db, "pages"), {
        title: newPage.title,
        slug: newPage.slug,
      });

      // Add page to the Menus collection to ensure it appears in the Navbar
      const menusRef = collection(db, "menus");
      const menuSnapshot = await getDocs(menusRef);
      const existingMenu = menuSnapshot.docs.find((doc) => doc.data().name === newPage.title);

      if (!existingMenu) {
        await addDoc(menusRef, {
          name: newPage.title,
          path: `/pages/${newPage.slug}`,
          submenus: [],
          order: 99, // Default order if not set
        });
      }

      setNewPage({ title: "", slug: "" });
      fetchPages();
      alert("Page created successfully!");
    } catch (error) {
      console.error("Error creating page:", error);
    }
  };

  // ✅ Delete Page (Also Remove from Menus)
  const deletePage = async (id, title) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await deleteDoc(doc(db, "pages", id));

      // Remove from Menus
      const menuSnapshot = await getDocs(collection(db, "menus"));
      const menuDoc = menuSnapshot.docs.find((doc) => doc.data().name === title);
      if (menuDoc) {
        await deleteDoc(doc(db, "menus", menuDoc.id));
      }

      setPages((prev) => prev.filter((page) => page.id !== id));
    } catch (error) {
      console.error("Error deleting page:", error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Pages Manager</h1>
      </div>

      {/* ✅ Add New Page */}
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Page Title"
          value={newPage.title}
          onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
          className="p-2 bg-gray-700 rounded w-1/2"
        />
        <input
          type="text"
          placeholder="Slug (e.g. about-us)"
          value={newPage.slug}
          onChange={(e) => setNewPage({ ...newPage, slug: e.target.value })}
          className="p-2 bg-gray-700 rounded w-1/2"
        />
        <button onClick={addPage} className="px-4 py-2 bg-blue-500 text-white rounded">
          <PlusCircle className="mr-2" /> Add Page
        </button>
      </div>

      {/* ✅ Page List */}
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
                <tr key={page.id} className="border-b border-gray-700 text-gray-300">
                  <td className="p-3">{page.title}</td>
                  <td className="p-3">{page.slug}</td>
                  <td className="p-3 flex justify-center space-x-2">
                    <Link href={`/admin/dashboard/pages/edit/${page.id}`}>
                      <button className="text-blue-400">
                        <Pencil />
                      </button>
                    </Link>
                    <button onClick={() => deletePage(page.id, page.title)} className="text-red-500">
                      <Trash2 />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-3 text-center text-gray-400">
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
