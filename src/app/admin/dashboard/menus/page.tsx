"use client";
import React, { useEffect, useState, ChangeEvent } from "react";
import { db } from "@/config/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Save, Trash2, PlusCircle, GripVertical } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Submenu {
  name: string;
  path: string;
}

interface Menu {
  id: string;
  name: string;
  path: string;
  order: number;
  submenus: Submenu[];
}

export default function MenuManager() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuData, setMenuData] = useState<{
    name: string;
    path: string;
    order: number;
  }>({ name: "", path: "", order: 0 });
  const [submenuData, setSubmenuData] = useState<Submenu>({
    name: "",
    path: "",
  });
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editingSubmenuIndex, setEditingSubmenuIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    const snap = await getDocs(collection(db, "menus"));
    const list: Menu[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Menu, "id">),
    }));
    setMenus(list.sort((a, b) => a.order - b.order));
  };

  const addMenu = async () => {
    if (!menuData.name || !menuData.path) {
      alert("Name and path required");
      return;
    }
    await addDoc(collection(db, "menus"), {
      ...menuData,
      submenus: [],
      order: menus.length,
    });
    setMenuData({ name: "", path: "", order: 0 });
    fetchMenus();
  };

  const updateMenu = async () => {
    if (!editingMenuId || !menuData.name || !menuData.path) return;
    await updateDoc(doc(db, "menus", editingMenuId), {
      name: menuData.name,
      path: menuData.path,
    });
    setEditingMenuId(null);
    setMenuData({ name: "", path: "", order: 0 });
    fetchMenus();
  };

  const addOrUpdateSubmenu = async () => {
    if (!submenuData.name || !submenuData.path || !selectedMenu) return;
    const menuRef = doc(db, "menus", selectedMenu);
    const menu = menus.find((m) => m.id === selectedMenu);
    if (!menu) return;
    const subs = [...menu.submenus];
    if (editingSubmenuIndex !== null) {
      subs[editingSubmenuIndex] = submenuData;
    } else {
      subs.push(submenuData);
    }
    await updateDoc(menuRef, { submenus: subs });
    setSubmenuData({ name: "", path: "" });
    setEditingSubmenuIndex(null);
    fetchMenus();
  };

  const editSubmenu = (menuId: string, index: number) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;
    setSelectedMenu(menuId);
    setSubmenuData(menu.submenus[index]);
    setEditingSubmenuIndex(index);
  };

  const deleteSubmenu = async (menuId: string, idx: number) => {
    if (!confirm("Delete this submenu?")) return;
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;
    const subs = menu.submenus.filter((_, i) => i !== idx);
    await updateDoc(doc(db, "menus", menuId), { submenus: subs });
    fetchMenus();
  };

  const saveMenuOrder = async () => {
    setSaving(true);
    try {
      await Promise.all(
        menus.map((m, i) =>
          updateDoc(doc(db, "menus", m.id), { order: i })
        )
      );
      alert("Order saved");
      fetchMenus();
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (e: any) => {
    const { active, over } = e;
    if (active.id !== over.id) {
      const oldIndex = menus.findIndex((m) => m.id === active.id);
      const newIndex = menus.findIndex((m) => m.id === over.id);
      setMenus(arrayMove(menus, oldIndex, newIndex));
    }
  };

  const deleteMenu = async (id: string) => {
    if (!confirm("Delete this menu?")) return;
    await deleteDoc(doc(db, "menus", id));
    fetchMenus();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Menu Manager</h1>
      <div className="flex justify-end mb-4">
        <button
          onClick={saveMenuOrder}
          disabled={saving}
          className="px-4 py-2 bg-green-500 text-white rounded flex items-center"
        >
          {saving ? "Saving..." : <><Save className="mr-2" />Save</>}
        </button>
      </div>

      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          placeholder="Name"
          value={menuData.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setMenuData((p) => ({ ...p, name: e.target.value }))
          }
          className="p-2 bg-gray-700 rounded w-1/3"
        />
        <input
          type="text"
          placeholder="Path"
          value={menuData.path}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setMenuData((p) => ({ ...p, path: e.target.value }))
          }
          className="p-2 bg-gray-700 rounded w-1/3"
        />
        {editingMenuId ? (
          <button
            onClick={updateMenu}
            className="px-4 py-2 bg-yellow-500 rounded text-black"
          >
            <Save className="mr-2" />Update
          </button>
        ) : (
          <button
            onClick={addMenu}
            className="px-4 py-2 bg-blue-500 rounded text-white"
          >
            <PlusCircle className="mr-2" />Add
          </button>
        )}
      </div>

      <div className="flex space-x-2 mb-6">
        <select
          value={selectedMenu || ""}
          onChange={(e) => setSelectedMenu(e.target.value)}
          className="p-2 bg-gray-700 rounded w-1/3"
        >
          <option value="">Select Menu</option>
          {menus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Submenu Name"
          value={submenuData.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSubmenuData((p) => ({ ...p, name: e.target.value }))
          }
          className="p-2 bg-gray-700 rounded w-1/3"
        />
        <input
          type="text"
          placeholder="Submenu Path"
          value={submenuData.path}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSubmenuData((p) => ({ ...p, path: e.target.value }))
          }
          className="p-2 bg-gray-700 rounded w-1/3"
        />
        <button
          onClick={addOrUpdateSubmenu}
          className={`px-4 py-2 ${
            editingSubmenuIndex !== null ? "bg-yellow-500" : "bg-green-500"
          } text-white rounded`}
        >
          <PlusCircle className="mr-2" />
          {editingSubmenuIndex !== null ? "Update" : "Add"}
        </button>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={menus.map((m) => m.id)}>
          <div className="overflow-x-auto bg-gray-800 p-4 rounded-lg shadow-md">
            <table className="w-full text-gray-300">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="p-3">Name</th>
                  <th className="p-3">Path</th>
                  <th className="p-3">Submenus</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => (
                  <SortableItem key={menu.id} id={menu.id}>
                    <td className="p-3 flex items-center">
                      <GripVertical className="mr-2 cursor-move" />
                      {menu.name}
                    </td>
                    <td className="p-3">{menu.path}</td>
                    <td className="p-3 space-y-1">
                      {menu.submenus.length > 0
                        ? menu.submenus.map((sub, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center"
                            >
                              <span>{sub.name}</span>
                              <div className="space-x-2 text-sm">
                                <button
                                  onClick={() => editSubmenu(menu.id, i)}
                                  className="text-yellow-400"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteSubmenu(menu.id, i)}
                                  className="text-red-500"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        : "—"}
                    </td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingMenuId(menu.id);
                          setMenuData({
                            name: menu.name,
                            path: menu.path,
                            order: menu.order,
                          });
                        }}
                        className="text-yellow-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMenu(menu.id)}
                        className="text-red-500"
                      >
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

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <tr
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="border-b border-gray-600"
    >
      {children}
    </tr>
  );
}
