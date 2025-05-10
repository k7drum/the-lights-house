"use client";
import { useState, useEffect } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Trash2, Edit, Plus, FileText, Download } from "lucide-react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { getAuth } from "firebase/auth";

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "member", // "admin", "co-admin", "leader", "pastor"
    address: "",
    phone: "",
    homecell: "",
  });
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState("member");

  useEffect(() => {
    const fetchRole = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
  
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        setUserRole(docSnap.data().role || "member");
      }
    };
    fetchRole();
    fetchMembers();
  }, []);

  

// ✅ Fetch Members from Firestore
const fetchMembers = async () => {
  try {
    console.log("🔹 Fetching members...");
    const querySnapshot = await getDocs(collection(db, "users")); // 🔄 Changed to "users"
    const memberList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMembers(memberList);
    console.log("✅ Members fetched:", memberList);
  } catch (error) {
    console.error("❌ Error fetching members:", error);
  }
};


// ✅ Add or Update Member in "users" Collection
const saveMember = async () => {
  if (!newMember.name || !newMember.email) {
    alert("Please fill all fields!");
    return;
  }

  setSaving(true);
  try {
    if (editingMember) {
      await updateDoc(doc(db, "users", editingMember.id), {
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        address: newMember.address,
        phone: newMember.phone,
        homecell: newMember.homecell,
      });
    } else {
      await addDoc(collection(db, "users"), { // 🔄 Changed to "users"
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        address: newMember.address,
        phone: newMember.phone,
        homecell: newMember.homecell,
        createdAt: new Date(),
      });
    }

    setNewMember({ name: "", email: "", role: "member", address: "", phone: "", homecell: "" });
    setEditingMember(null);
    fetchMembers();
    alert("Member Saved Successfully!");
  } catch (error) {
    console.error("Error saving member:", error);
    alert("Failed to save member.");
  }
  setSaving(false);
};


  // ✅ Edit Member
  const editMember = (member: any) => {
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

  // ✅ Delete Member
  const deleteMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, "members", id));
      fetchMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  // ✅ Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(members);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "members_list.xlsx");
  };

  // ✅ Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Members List", 20, 10);
    doc.autoTable({
      head: [["Name", "Email", "Role", "Address", "Phone", "Homecell"]],
      body: members.map((member) => [
        member.name,
        member.email,
        member.role,
        member.address,
        member.phone,
        member.homecell,
      ]),
    });
    doc.save("members_list.pdf");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Member Management</h1>

      {/* Add or Edit Member Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">{editingMember ? "Edit Member" : "Add New Member"}</h2>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Address"
            value={newMember.address}
            onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Phone (Optional)"
            value={newMember.phone}
            onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="text"
            placeholder="Homecell Group"
            value={newMember.homecell}
            onChange={(e) => setNewMember({ ...newMember, homecell: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          />
          <select
            value={newMember.role}
            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
            className="p-2 bg-gray-700 rounded"
          >
            <option value="member">Member</option>
            {userRole === "admin" && <option value="leader">Leader</option>}
            <option value="pastor">Pastor</option>
            <option value="co-admin">Co-Admin</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button onClick={saveMember} disabled={saving} className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center">
          {saving ? "Saving..." : <><Plus className="mr-2" /> {editingMember ? "Update Member" : "Save Member"}</>}
        </button>
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

      {/* Member List */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">All Members</h2>
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
            {members.map((member) => (
              <tr key={member.id}>
                <td className="p-2">{member.name}</td>
                <td className="p-2">{member.email}</td>
                <td className="p-2">{member.role}</td>
                <td className="p-2 flex space-x-2">
                  <button onClick={() => editMember(member)} className="text-blue-400">
                    <Edit />
                  </button>
                  <button onClick={() => deleteMember(member.id)} className="text-red-500">
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
