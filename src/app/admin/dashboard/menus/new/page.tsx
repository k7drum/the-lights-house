"use client";
import React, { useState, ChangeEvent } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Save, Plus, Trash2 } from "lucide-react";

export default function AddMenu() {
  const [menuName, setMenuName] = useState<string>("");
  const [submenu, setSubmenu] = useState<string>("");
  const [submenus, setSubmenus] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Add a submenu to the list
  const addSubmenu = () => {
    const trimmed = submenu.trim();
    if (trimmed && !submenus.includes(trimmed)) {
      setSubmenus((prev) => [...prev, trimmed]);
      setSubmenu("");
    }
  };

  // Remove a submenu from the list
  const removeSubmenu = (index: number) => {
    setSubmenus((prev) => prev.filter((_, i) => i !== index));
  };

  // Save the new menu to Firestore
  const saveMenu = async () => {
    if (!menuName.trim()) {
      alert("Menu name is required!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "menus"), {
        name: menuName.trim(),
        submenus,
      });
      alert("Menu added successfully!");
      router.push("/admin/dashboard/menus");
    } catch (error) {
      console.error("Error adding menu:", error);
      alert("Failed to add menu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Add New Menu</h1>

      {/* Menu Name */}
      <div className="mb-4">
        <label className="block text-gray-400 mb-1">Menu Name</label>
        <input
          type="text"
          value={menuName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMenuName(e.target.value)}
          className="p-2 bg-gray-700 rounded w-full"
          placeholder="Enter menu name"
        />
      </div>

      {/* Submenus */}
      <div className="mb-4">
        <label className="block text-gray-400 mb-1">Add Submenu</label>
        <div className="flex items-center">
          <input
            type="text"
            value={submenu}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSubmenu(e.target.value)}
            className="p-2 bg-gray-700 rounded w-full mr-2"
            placeholder="Enter submenu name"
          />
          <button
            onClick={addSubmenu}
            className="px-4 py-2 bg-blue-500 text-white rounded flex items-center"
          >
            <Plus className="mr-1" /> Add
          </button>
        </div>

        {/* Display Submenus */}
        <div className="mt-2 flex flex-wrap gap-2">
          {submenus.map((sub, index) => (
            <span
              key={index}
              className="bg-green-600 text-white px-2 py-1 rounded-lg flex items-center"
            >
              {sub}
              <button
                onClick={() => removeSubmenu(index)}
                className="ml-2 text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveMenu}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-green-600 rounded-lg text-white flex items-center"
      >
        <Save className="mr-2" />
        {loading ? "Saving..." : "Save Menu"}
      </button>
    </div>
  );
}
