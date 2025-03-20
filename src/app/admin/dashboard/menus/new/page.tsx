"use client";
import { useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Save, Plus } from "lucide-react";

export default function AddMenu() {
  const [menuName, setMenuName] = useState("");
  const [submenu, setSubmenu] = useState("");
  const [submenus, setSubmenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ✅ Add Submenu
  const addSubmenu = () => {
    if (submenu && !submenus.includes(submenu)) {
      setSubmenus([...submenus, submenu]);
      setSubmenu("");
    }
  };

  // ✅ Save Menu
  const saveMenu = async () => {
    if (!menuName) {
      alert("Menu name is required!");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "menus"), {
        name: menuName,
        submenus,
      });

      alert("Menu added successfully!");
      router.push("/admin/dashboard/menus");
    } catch (error) {
      console.error("Error adding menu:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Add New Menu</h1>

      {/* ✅ Menu Name */}
      <div className="mb-4">
        <label className="block text-gray-400">Menu Name</label>
        <input
          type="text"
          value={menuName}
          onChange={(e) => setMenuName(e.target.value)}
          className="p-2 bg-gray-700 rounded w-full"
        />
      </div>

      {/* ✅ Submenus */}
      <div className="mb-4">
        <label className="block text-gray-400">Add Submenu</label>
        <div className="flex">
          <input
            type="text"
            value={submenu}
            onChange={(e) => setSubmenu(e.target.value)}
            className="p-2 bg-gray-700 rounded w-full mr-2"
          />
          <button onClick={addSubmenu} className="px-4 py-2 bg-blue-500 text-white rounded">
            <Plus />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap">
          {submenus.map((sub, index) => (
            <span key={index} className="bg-green-600 text-white px-2 py-1 rounded-lg mr-2 mb-2">{sub}</span>
          ))}
        </div>
      </div>

      {/* ✅ Save Button */}
      <button onClick={saveMenu} disabled={loading} className="mt-4 px-4 py-2 bg-green-600 rounded-lg text-white flex items-center">
        <Save className="mr-2" /> {loading ? "Saving..." : "Save Menu"}
      </button>
    </div>
  );
}
