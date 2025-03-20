"use client";
import { useState, useEffect } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Trash2, Edit, Plus, Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function HomecellManagement() {
  const [homecells, setHomecells] = useState<any[]>([]);
  const [editingHomecell, setEditingHomecell] = useState<any>(null);
  const [newHomecell, setNewHomecell] = useState({
    name: "",
    leader: "",
    location: "",
    membersCount: 0,
    manualBookkeeping: "",
  });

  useEffect(() => {
    fetchHomecells();
  }, []);

  // ✅ Fetch Homecell Groups from Firestore
  const fetchHomecells = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "homecells"));
      const homecellList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHomecells(homecellList);
    } catch (error) {
      console.error("Error fetching homecells:", error);
    }
  };

  // ✅ Save or Update Homecell
  const saveHomecell = async () => {
    if (!newHomecell.name || !newHomecell.leader || !newHomecell.location) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      if (editingHomecell) {
        await updateDoc(doc(db, "homecells", editingHomecell.id), {
          name: newHomecell.name,
          leader: newHomecell.leader,
          location: newHomecell.location,
          membersCount: newHomecell.membersCount,
          manualBookkeeping: newHomecell.manualBookkeeping,
        });
      } else {
        await addDoc(collection(db, "homecells"), {
          name: newHomecell.name,
          leader: newHomecell.leader,
          location: newHomecell.location,
          membersCount: newHomecell.membersCount,
          manualBookkeeping: newHomecell.manualBookkeeping,
          createdAt: new Date(),
        });
      }

      setNewHomecell({ name: "", leader: "", location: "", membersCount: 0, manualBookkeeping: "" });
      setEditingHomecell(null);
      fetchHomecells();
      alert("Homecell Group Saved Successfully!");
    } catch (error) {
      console.error("Error saving homecell:", error);
      alert("Failed to save homecell.");
    }
  };

  // ✅ Edit Homecell
  const editHomecell = (homecell: any) => {
    setEditingHomecell(homecell);
    setNewHomecell({
      name: homecell.name,
      leader: homecell.leader,
      location: homecell.location,
      membersCount: homecell.membersCount || 0,
      manualBookkeeping: homecell.manualBookkeeping || "",
    });
  };

  // ✅ Delete Homecell
  const deleteHomecell = async (id: string) => {
    try {
      await deleteDoc(doc(db, "homecells", id));
      fetchHomecells();
    } catch (error) {
      console.error("Error deleting homecell:", error);
    }
  };

  // ✅ Export Homecell Data to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(homecells);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Homecells");
    XLSX.writeFile(workbook, "homecell_groups.xlsx");
  };

  // ✅ Export Homecell Data to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Homecell Groups", 20, 10);
    doc.autoTable({
      head: [["Name", "Leader", "Location", "Members Count", "Manual Bookkeeping"]],
      body: homecells.map((homecell) => [
        homecell.name,
        homecell.leader,
        homecell.location,
        homecell.membersCount,
        homecell.manualBookkeeping,
      ]),
    });
    doc.save("homecell_groups.pdf");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Homecell Management</h1>

      {/* Add or Edit Homecell Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">{editingHomecell ? "Edit Homecell Group" : "Add New Homecell"}</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Homecell Name"
            value={newHomecell.name}
            onChange={(e) => setNewHomecell({ ...newHomecell, name: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Leader"
            value={newHomecell.leader}
            onChange={(e) => setNewHomecell({ ...newHomecell, leader: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Location"
            value={newHomecell.location}
            onChange={(e) => setNewHomecell({ ...newHomecell, location: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <div>
            <label className="text-gray-400 block mb-1">Number of Members</label>
            <input
              type="number"
              placeholder="Number of Members"
              value={newHomecell.membersCount}
              onChange={(e) => setNewHomecell({ ...newHomecell, membersCount: Number(e.target.value) })}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </div>
        </div>

        {/* ✅ Manual Bookkeeping Notes */}
        <textarea
          placeholder="Manual Bookkeeping Notes"
          value={newHomecell.manualBookkeeping}
          onChange={(e) => setNewHomecell({ ...newHomecell, manualBookkeeping: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mt-2"
        />

        <button onClick={saveHomecell} className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center">
          <Plus className="mr-2" /> {editingHomecell ? "Update Homecell" : "Save Homecell"}
        </button>
      </div>

      {/* Homecell List */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">All Homecell Groups</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Leader</th>
              <th className="p-2">Location</th>
              <th className="p-2">Members Count</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {homecells.map((homecell) => (
              <tr key={homecell.id}>
                <td className="p-2">{homecell.name}</td>
                <td className="p-2">{homecell.leader}</td>
                <td className="p-2">{homecell.location}</td>
                <td className="p-2">{homecell.membersCount}</td>
                <td className="p-2 flex space-x-2">
                  <button onClick={() => editHomecell(homecell)} className="text-blue-400">
                    <Edit />
                  </button>
                  <button onClick={() => deleteHomecell(homecell.id)} className="text-red-500">
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Options */}
      <div className="mt-4 flex space-x-2">
        <button onClick={exportToExcel} className="px-4 py-2 bg-blue-500 rounded-lg text-white flex items-center">
          <Download className="mr-2" /> Export to Excel
        </button>
        <button onClick={exportToPDF} className="px-4 py-2 bg-green-500 rounded-lg text-white flex items-center">
          <Download className="mr-2" /> Export to PDF
        </button>
      </div>
    </div>
  );
}
