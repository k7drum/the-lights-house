"use client";
import React, { useEffect, useState, ChangeEvent } from "react";
import { db, storage } from "@/config/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Check,
  XCircle,
  Trash2,
  Save,
  Upload,
  User as UserIcon,
  Edit,
} from "lucide-react";

interface Testimony {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  maritalStatus: string;
  membershipStatus: string;
  testimonyType: string;
  message: string;
  profileImage: string;
  status: string;
  date: string;
}

export default function TestimoniesPage() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState<Omit<Testimony, "id">>({
    name: "",
    email: "",
    phone: "",
    address: "",
    maritalStatus: "single",
    membershipStatus: "member",
    testimonyType: "healing",
    message: "",
    profileImage: "",
    status: "pending",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchTestimonies();
  }, []);

  const fetchTestimonies = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "testimonies"));
      const list: Testimony[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Testimony, "id">),
      }));
      setTestimonies(list);
    } catch (err) {
      console.error("Error fetching testimonies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const uploadImage = async () => {
    if (!imageFile) return;
    const imageRef = ref(storage, `testimonies/${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const url = await getDownloadURL(imageRef);
    setForm((prev) => ({ ...prev, profileImage: url }));
    alert("Image uploaded successfully!");
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      maritalStatus: "single",
      membershipStatus: "member",
      testimonyType: "healing",
      message: "",
      profileImage: "",
      status: "pending",
      date: new Date().toISOString().split("T")[0],
    });
    setEditId(null);
    setImageFile(null);
  };

  const saveNewTestimony = async () => {
    if (!form.name || !form.email || !form.message) {
      alert("Name, Email, and Message are required!");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "testimonies"), form);
      alert("Testimony added successfully!");
      resetForm();
      fetchTestimonies();
    } catch (err) {
      console.error("Error adding testimony:", err);
      alert("Failed to add testimony.");
    } finally {
      setLoading(false);
    }
  };

  const updateTestimony = async () => {
    if (!editId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "testimonies", editId), form);
      alert("Testimony updated successfully!");
      resetForm();
      fetchTestimonies();
    } catch (err) {
      console.error("Error updating testimony:", err);
      alert("Failed to update testimony.");
    } finally {
      setLoading(false);
    }
  };

  const deleteTestimony = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return;
    try {
      await deleteDoc(doc(db, "testimonies", id));
      fetchTestimonies();
    } catch (err) {
      console.error("Error deleting testimony:", err);
      alert("Failed to delete testimony.");
    }
  };

  const approveTestimony = async (id: string) => {
    try {
      await updateDoc(doc(db, "testimonies", id), { status: "approved" });
      fetchTestimonies();
    } catch (err) {
      console.error("Error approving testimony:", err);
      alert("Failed to approve testimony.");
    }
  };

  const rejectTestimony = async (id: string) => {
    try {
      await updateDoc(doc(db, "testimonies", id), { status: "rejected" });
      fetchTestimonies();
    } catch (err) {
      console.error("Error rejecting testimony:", err);
      alert("Failed to reject testimony.");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Testimonies</h1>

      {/* Form */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-gray-300 mb-2">
          {editId ? "Edit Testimony" : "Add New Testimony"}
        </h2>

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="p-2 bg-gray-700 rounded w-full mb-2 text-white"
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          className="p-2 bg-gray-700 rounded w-full mb-2 text-white"
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleChange}
          className="p-2 bg-gray-700 rounded w-full mb-2 text-white"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          className="p-2 bg-gray-700 rounded w-full mb-2 text-white"
        />
        <textarea
          name="message"
          placeholder="Testimony Message"
          value={form.message}
          onChange={handleChange}
          className="p-2 bg-gray-700 rounded w-full mb-2 h-24 text-white"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="mb-2"
        />
        <button
          onClick={uploadImage}
          className="px-4 py-2 bg-yellow-500 text-black rounded mb-2 flex items-center"
        >
          <Upload className="mr-2" /> Upload Image
        </button>

        <button
          onClick={editId ? updateTestimony : saveNewTestimony}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded flex items-center"
        >
          <Save className="mr-2" />
          {editId ? "Update Testimony" : "Add Testimony"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-gray-800 p-4 rounded-lg shadow-md">
        <table className="w-full text-gray-300">
          <thead>
            <tr className="bg-gray-700 text-white">
              <th className="p-3 text-left">Profile</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Message</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonies.map((t) => (
              <tr key={t.id} className="border-b border-gray-600">
                <td className="p-3">
                  {t.profileImage ? (
                    <img
                      src={t.profileImage}
                      alt="Profile"
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <UserIcon size={24} />
                  )}
                </td>
                <td className="p-3">{t.name}</td>
                <td className="p-3">{t.message}</td>
                <td className="p-3">{t.status}</td>
                <td className="p-3 flex justify-center space-x-2">
                  <button
                    onClick={() => {
                      setEditId(t.id);
                      setForm({
                        name: t.name,
                        email: t.email,
                        phone: t.phone,
                        address: t.address,
                        maritalStatus: t.maritalStatus,
                        membershipStatus: t.membershipStatus,
                        testimonyType: t.testimonyType,
                        message: t.message,
                        profileImage: t.profileImage,
                        status: t.status,
                        date: t.date,
                      });
                    }}
                    className="text-yellow-400"
                  >
                    <Edit />
                  </button>
                  <button
                    onClick={() => deleteTestimony(t.id)}
                    className="text-red-500"
                  >
                    <Trash2 />
                  </button>
                  <button
                    onClick={() => approveTestimony(t.id)}
                    className="text-green-500"
                  >
                    <Check />
                  </button>
                  <button
                    onClick={() => rejectTestimony(t.id)}
                    className="text-yellow-500"
                  >
                    <XCircle />
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
