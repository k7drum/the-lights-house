"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { db } from "@/config/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Trash2, Edit, Plus, FileText, Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  address?: string;
  phone?: string;
  homecell?: string;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState<Omit<Member, "id">>({
    name: "",
    email: "",
    role: "member",
    address: "",
    phone: "",
    homecell: "",
  });
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<"member" | "leader" | "pastor" | "co-admin" | "admin">("member");

  useEffect(() => {
    const fetchRoleAndMembers = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole((userDoc.data().role as any) || "member");
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      }
      await fetchMembers();
    };
    fetchRoleAndMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: Member[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Member, "id">),
      }));
      setMembers(list);
    } catch (err) {
      console.error("Error fetching members:", err);
    }
  };

  const saveMember = async () => {
    if (!newMember.name || !newMember.email) {
      alert("Please fill all required fields!");
      return;
    }
    setSaving(true);
    try {
      if (editingMember) {
        await updateDoc(doc(db, "users", editingMember.id), newMember);
      } else {
        await addDoc(collection(db, "users"), {
          ...newMember,
          createdAt: new Date(),
        });
      }
      setNewMember({ name: "", email: "", role: "member", address: "", phone: "", homecell: "" });
      setEditingMember(null);
      await fetchMembers();
      alert("Member saved successfully!");
    } catch (err) {
      console.error("Error saving member:", err);
      alert("Failed to save member.");
    } finally {
      setSaving(false);
    }
  };

  const editMember = (member: Member) => {
    setEditingMember(member);
    setNewMember({
      name: member.name,
      email: member.email,
      role: member.role,
      address: member.address || "",
      phone: member.phone || "",
      homecell: member.homecell || "",
    });
  };

  const deleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      await fetchMembers();
      alert("Member deleted.");
    } catch (err) {
      console.error("Error deleting member:", err);
      alert("Failed to delete member.");
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(members);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "members_list.xlsx");
  };

  const exportToPDF = () => {
    const pdf = new jsPDF();
    pdf.text("Members List", 14, 16);
    pdf.autoTable({
      head: [["Name", "Email", "Role", "Address", "Phone", "Homecell"]],
      body: members.map((m) => [
        m.name,
        m.email,
        m.role,
        m.address || "",
        m.phone || "",
        m.homecell || "",
      ]),
      startY: 20,
    });
    pdf.save("members_list.pdf");
  };

  const handleChange =
    (field: keyof Omit<Member, "id">) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setNewMember((prev) => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Member Management</h1>

      {/* Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">
          {editingMember ? "Edit Member" : "Add New Member"}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={newMember.name}
            onChange={handleChange("name")}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={newMember.email}
            onChange={handleChange("email")}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Address"
            value={newMember.address}
            onChange={handleChange("address")}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Phone (Optional)"
            value={newMember.phone}
            onChange={handleChange("phone")}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Homecell Group"
            value={newMember.homecell}
            onChange={handleChange("homecell")}
            className="p-2 bg-gray-700 rounded"
          />
          <select
            value={newMember.role}
            onChange={handleChange("role")}
            className="p-2 bg-gray-700 rounded"
          >
            <option value="member">Member</option>
            {userRole === "admin" && <option value="leader">Leader</option>}
            <option value="pastor">Pastor</option>
            <option value="co-admin">Co-Admin</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          onClick={saveMember}
          disabled={saving}
          className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center"
        >
          <Plus className="mr-2" />
          {saving ? "Saving..." : editingMember ? "Update Member" : "Save Member"}
        </button>
      </div>

      {/* Export Buttons */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-blue-500 rounded-lg text-white flex items-center"
        >
          <Download className="mr-2" /> Export to Excel
        </button>
        <button
          onClick={exportToPDF}
          className="px-4 py-2 bg-green-500 rounded-lg text-white flex items-center"
        >
          <Download className="mr-2" /> Export to PDF
        </button>
      </div>

      {/* Member List */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">All Members</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td className="p-2">{m.name}</td>
                <td className="p-2">{m.email}</td>
                <td className="p-2">{m.role}</td>
                <td className="p-2 flex space-x-2">
                  <button onClick={() => editMember(m)} className="text-blue-400">
                    <Edit />
                  </button>
                  <button onClick={() => deleteMember(m.id)} className="text-red-500">
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
