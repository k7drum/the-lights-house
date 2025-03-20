"use client";
import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Save, Trash2, PlusCircle, GripVertical } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function MenuManager() {
  const [menus, setMenus] = useState([]);
  const [menuData, setMenuData] = useState({ name: "", path: "", order: 0 });
  const [submenuData, setSubmenuData] = useState({ name: "", path: "" });
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  // ✅ Fetch Menus from Firestore
  const fetchMenus = async () => {
    const querySnapshot = await getDocs(collection(db, "menus"));
    const menuList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMenus(menuList.sort((a, b) => a.order - b.order)); // Sort menus by order
  };

  // ✅ Add Menu
  const addMenu = async () => {
    if (!menuData.name || !menuData.path) return alert("Menu name and path are required.");
    await addDoc(collection(db, "menus"), { ...menuData, submenus: [], order: menus.length });
    setMenuData({ name: "", path: "", order: 0 });
    fetchMenus();
  };

  // ✅ Add Submenu
  const addSubmenu = async () => {
    if (!submenuData.name || !submenuData.path || !selectedMenu) return;
    const menuRef = doc(db, "menus", selectedMenu);
    const updatedMenus = menus.map((menu) =>
      menu.id === selectedMenu ? { ...menu, submenus: [...menu.submenus, submenuData] } : menu
    );
    await updateDoc(menuRef, {
      submenus: updatedMenus.find((menu) => menu.id === selectedMenu).submenus,
    });

    setSubmenuData({ name: "", path: "" });
    fetchMenus();
  };

  // ✅ Save Menu Order
  const saveMenuOrder = async () => {
    setSaving(true);
    try {
      for (let i = 0; i < menus.length; i++) {
        await updateDoc(doc(db, "menus", menus[i].id), { order: i });
      }
      alert("Menus saved successfully!");
      fetchMenus();
    } catch (error) {
      console.error("Error saving menus:", error);
      alert("Failed to save menus.");
    }
    setSaving(false);
  };

  // ✅ Drag and Drop Sorting
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = menus.findIndex((menu) => menu.id === active.id);
      const newIndex = menus.findIndex((menu) => menu.id === over.id);
      const reorderedMenus = arrayMove(menus, oldIndex, newIndex);
      setMenus(reorderedMenus);
    }
  };

  // ✅ Delete Menu
  const deleteMenu = async (id) => {
    if (!confirm("Are you sure you want to delete this menu?")) return;
    await deleteDoc(doc(db, "menus", id));
    fetchMenus();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Menu Manager</h1>

      {/* ✅ Save Changes Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={saveMenuOrder}
          className="px-4 py-2 bg-green-500 text-white rounded flex items-center"
          disabled={saving}
        >
          {saving ? "Saving..." : <>
            <Save className="mr-2" /> Save Changes
          </>}
        </button>
      </div>

      {/* ✅ Add New Menu */}
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Menu Name"
          value={menuData.name}
          onChange={(e) => setMenuData({ ...menuData, name: e.target.value })}
          className="p-2 bg-gray-700 rounded w-1/3"
        />
        <input
          type="text"
          placeholder="Menu Path"
          value={menuData.path}
          onChange={(e) => setMenuData({ ...menuData, path: e.target.value })}
          className="p-2 bg-gray-700 rounded w-1/3"
        />
        <button onClick={addMenu} className="px-4 py-2 bg-blue-500 text-white rounded">
          <PlusCircle className="mr-2" /> Add Menu
        </button>
      </div>

      {/* ✅ Add New Submenu */}
      <div className="flex space-x-2 mb-6">
        <select
          onChange={(e) => setSelectedMenu(e.target.value)}
          className="p-2 bg-gray-700 rounded w-1/3"
        >
          <option value="">Select Menu</option>
          {menus.map((menu) => (
            <option key={menu.id} value={menu.id}>
              {menu.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Submenu Name"
          value={submenuData.name}
          onChange={(e) => setSubmenuData({ ...submenuData, name: e.target.value })}
          className="p-2 bg-gray-700 rounded w-1/3"
        />
        <input
          type="text"
          placeholder="Submenu Path"
          value={submenuData.path}
          onChange={(e) => setSubmenuData({ ...submenuData, path: e.target.value })}
          className="p-2 bg-gray-700 rounded w-1/3"
        />
        <button onClick={addSubmenu} className="px-4 py-2 bg-green-500 text-white rounded">
          <PlusCircle className="mr-2" /> Add Submenu
        </button>
      </div>

      {/* ✅ Menu List with Drag & Drop */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={menus.map((menu) => menu.id)}>
          <div className="overflow-x-auto bg-gray-800 p-4 rounded-lg shadow-md">
            <table className="w-full text-gray-300">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="p-3 text-left">Menu Name</th>
                  <th className="p-3 text-left">Path</th>
                  <th className="p-3 text-left">Submenus</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <SortableItem key={menu.id} id={menu.id}>
                    <td className="p-3 flex items-center">
                      <GripVertical className="cursor-move mr-2" />
                      {menu.name}
                    </td>
                    <td className="p-3">{menu.path}</td>
                    <td className="p-3">{menu.submenus?.map(sub => sub.name).join(", ") || "No submenus"}</td>
                    <td className="p-3 flex justify-center">
                      <button onClick={() => deleteMenu(menu.id)} className="text-red-500">
                        <Trash2 />
                      </button>
                    </td>
                  </SortableItem>
                ))}
              </tbody>
            </table>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ✅ Fix: Define `SortableItem`
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} {...attributes} {...listeners} style={style} className="border-b border-gray-600">
      {children}
    </tr>
  );
}
