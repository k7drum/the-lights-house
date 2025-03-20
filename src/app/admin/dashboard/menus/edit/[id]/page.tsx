"use client";
import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { Save, Plus, Trash2 } from "lucide-react";

export default function EditMenu() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState({
    name: "",
    submenus: [],
  });
  const [newSubmenu, setNewSubmenu] = useState("");

  // ✅ Fetch Menu Data
  useEffect(() => {
    if (id) {
      fetchMenu();
    }
  }, [id]);

  const fetchMenu = async () => {
    if (!id) return;

    try {
      const docRef = doc(db, "menus", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setMenu(docSnap.data());
      } else {
        console.error("Menu not found!");
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
    }
  };

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    setMenu((prev) => ({ ...prev, name: e.target.value }));
  };

  // ✅ Add Submenu
  const addSubmenu = () => {
    if (newSubmenu && !menu.submenus.includes(newSubmenu)) {
      setMenu((prev) => ({ ...prev, submenus: [...prev.submenus, newSubmenu] }));
      setNewSubmenu("");
    }
  };

  // ✅ Remove Submenu
  const removeSubmenu = (index) => {
    setMenu((prev) => ({
      ...prev,
      submenus: prev.submenus.filter((_, i) => i !== index),
    }));
  };

  // ✅ Save Changes
  const saveMenu = async () => {
    if (!menu.name) {
      alert("Menu name is required!");
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, "menus", id), {
        name: menu.name,
        submenus: menu.submenus,
      });

      alert("Menu updated successfully!");
      router.push("/admin/dashboard/menus");
    } catch (error) {
      console.error("Error updating menu:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Edit Menu</h1>

      {menu.name ? (
        <>
          {/* ✅ Menu Name */}
          <div className="mb-4">
            <label className="block text-gray-400">Menu Name</label>
            <input
              type="text"
              value={menu.name}
              onChange={handleChange}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </div>

          {/* ✅ Submenus */}
          <div className="mb-4">
            <label className="block text-gray-400">Submenus</label>
            <div className="flex">
              <input
                type="text"
                value={newSubmenu}
                onChange={(e) => setNewSubmenu(e.target.value)}
                className="p-2 bg-gray-700 rounded w-full mr-2"
              />
              <button onClick={addSubmenu} className="px-4 py-2 bg-blue-500 text-white rounded">
                <Plus />
              </button>
            </div>

            {/* ✅ List of Submenus */}
            <div className="mt-2 flex flex-wrap">
              {menu.submenus.map((sub, index) => (
                <span key={index} className="bg-green-600 text-white px-2 py-1 rounded-lg mr-2 mb-2 flex items-center">
                  {sub}
                  <button onClick={() => removeSubmenu(index)} className="ml-2 text-red-400">
                    <Trash2 size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* ✅ Save Button */}
          <button
            onClick={saveMenu}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-green-600 rounded-lg text-white flex items-center"
          >
            <Save className="mr-2" /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </>
      ) : (
        <p className="text-gray-400">Loading menu...</p>
      )}
    </div>
  );
}
