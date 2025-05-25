"use client";
import React, { useEffect, useState, ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Save, Plus, Trash2 } from "lucide-react";

interface Menu {
  name: string;
  submenus: string[];
}

export default function EditMenu() {
  const router = useRouter();
  const params = useParams() as { id?: string | string[] };
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState<Menu>({ name: "", submenus: [] });
  const [newSubmenu, setNewSubmenu] = useState("");

  useEffect(() => {
    if (id) {
      fetchMenu();
    }
  }, [id]);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, "menus", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as Menu;
        setMenu({ name: data.name, submenus: data.submenus || [] });
      } else {
        console.error("Menu not found:", id);
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMenu((prev) => ({ ...prev, name: e.target.value }));
  };

  const addSubmenu = () => {
    const trimmed = newSubmenu.trim();
    if (trimmed && !menu.submenus.includes(trimmed)) {
      setMenu((prev) => ({
        ...prev,
        submenus: [...prev.submenus, trimmed],
      }));
      setNewSubmenu("");
    }
  };

  const removeSubmenu = (index: number) => {
    setMenu((prev) => ({
      ...prev,
      submenus: prev.submenus.filter((_, i) => i !== index),
    }));
  };

  const saveMenu = async () => {
    if (!menu.name.trim()) {
      alert("Menu name is required!");
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, "menus", id), {
        name: menu.name.trim(),
        submenus: menu.submenus,
      });
      alert("Menu updated successfully!");
      router.push("/admin/dashboard/menus");
    } catch (err) {
      console.error("Error updating menu:", err);
      alert("Failed to update menu.");
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return <p className="p-6 text-white">Invalid menu ID.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Edit Menu</h1>

      {loading && !menu.name ? (
        <p className="text-gray-400">Loading menu...</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-gray-400 mb-1">Menu Name</label>
            <input
              type="text"
              value={menu.name}
              onChange={handleNameChange}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-400 mb-1">Submenus</label>
            <div className="flex mb-2">
              <input
                type="text"
                value={newSubmenu}
                onChange={(e) => setNewSubmenu(e.target.value)}
                className="p-2 bg-gray-700 rounded w-full mr-2"
                placeholder="New submenu name"
              />
              <button
                onClick={addSubmenu}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                <Plus />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {menu.submenus.map((sub, idx) => (
                <span
                  key={idx}
                  className="bg-green-600 text-white px-2 py-1 rounded-lg flex items-center"
                >
                  {sub}
                  <button
                    onClick={() => removeSubmenu(idx)}
                    className="ml-2 text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={saveMenu}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-green-600 rounded-lg text-white flex items-center"
          >
            <Save className="mr-2" /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </>
      )}
    </div>
  );
}
