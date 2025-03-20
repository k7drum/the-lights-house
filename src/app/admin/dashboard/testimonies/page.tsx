"use client";
import { useEffect, useState } from "react";
import { db, storage } from "@/config/firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Check, XCircle, Trash2, PlusCircle, Save, Edit, Upload, User } from "lucide-react";

export default function TestimoniesPage() {
  const [testimonies, setTestimonies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null); // Track editing testimony
  const [imageFile, setImageFile] = useState(null);
  const [form, setForm] = useState({
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
    date: new Date().toISOString().split("T")[0], // Default to today's date
  });

  // ✅ Fetch Testimonies
  useEffect(() => {
    fetchTestimonies();
  }, []);

  const fetchTestimonies = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "testimonies"));
      const testimoniesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTestimonies(testimoniesList);
    } catch (error) {
      console.error("Error fetching testimonies:", error);
    }
    setLoading(false);
  };

  // ✅ Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Upload Profile Image
  const uploadImage = async () => {
    if (!imageFile) return;
    const imageRef = ref(storage, `testimonies/${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(imageRef);
    setForm((prev) => ({ ...prev, profileImage: downloadURL }));
    alert("Image uploaded successfully!");
  };

  // ✅ Save New Testimony
  const saveNewTestimony = async () => {
    if (!form.name || !form.email || !form.message) {
      alert("Name, Email, and Message are required!");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "testimonies"), form);
      alert("Testimony added successfully!");
      resetForm();
      fetchTestimonies();
    } catch (error) {
      console.error("Error adding testimony:", error);
    }
    setLoading(false);
  };

  // ✅ Update Existing Testimony
  const updateTestimony = async () => {
    if (!editId) return;

    try {
      setLoading(true);
      await updateDoc(doc(db, "testimonies", editId), form);
      alert("Testimony updated successfully!");
      setEditId(null);
      resetForm();
      fetchTestimonies();
    } catch (error) {
      console.error("Error updating testimony:", error);
    }
    setLoading(false);
  };

  // ✅ Delete Testimony
  const deleteTestimony = async (id) => {
    if (!confirm("Are you sure you want to delete this testimony?")) return;
    try {
      await deleteDoc(doc(db, "testimonies", id));
      fetchTestimonies();
    } catch (error) {
      console.error("Error deleting testimony:", error);
    }
  };

  // ✅ Approve Testimony
  const approveTestimony = async (id) => {
    try {
      await updateDoc(doc(db, "testimonies", id), { status: "approved" });
      fetchTestimonies();
    } catch (error) {
      console.error("Error approving testimony:", error);
    }
  };

  // ✅ Reject Testimony
  const rejectTestimony = async (id) => {
    try {
      await updateDoc(doc(db, "testimonies", id), { status: "rejected" });
      fetchTestimonies();
    } catch (error) {
      console.error("Error rejecting testimony:", error);
    }
  };

  // ✅ Reset Form
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
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Testimonies</h1>

      {/* ✅ New Testimony Form */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-300">{editId ? "Edit Testimony" : "Add New Testimony"}</h2>

        <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Full Name" className="p-2 bg-gray-700 rounded w-full mb-2" />
        <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email Address" className="p-2 bg-gray-700 rounded w-full mb-2" />
        <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" className="p-2 bg-gray-700 rounded w-full mb-2" />
        <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="Address" className="p-2 bg-gray-700 rounded w-full mb-2" />

        <textarea name="message" value={form.message} onChange={handleChange} placeholder="Testimony Message" className="p-2 bg-gray-700 rounded w-full mb-2 h-20"></textarea>

        <input type="file" onChange={(e) => setImageFile(e.target.files[0])} className="p-2 bg-gray-700 rounded w-full mb-2" />
        <button onClick={uploadImage} className="px-4 py-2 bg-yellow-500 text-white rounded flex items-center mb-2">
          <Upload className="mr-2" /> Upload Profile Image
        </button>

        <button onClick={editId ? updateTestimony : saveNewTestimony} className="px-4 py-2 bg-green-600 text-white rounded flex items-center">
          <Save className="mr-2" /> {editId ? "Update Testimony" : "Add Testimony"}
        </button>
      </div>

      {/* ✅ List of Testimonies */}
      <div className="overflow-x-auto bg-gray-800 p-4 rounded-lg shadow-md">
        <table className="w-full text-gray-300">
          <thead>
            <tr className="bg-gray-700 text-white">
              <th className="p-3 text-left">Profile</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Testimony</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonies.map((testimony) => (
              <tr key={testimony.id} className="border-b border-gray-600">
                <td className="p-3">{testimony.profileImage ? <img src={testimony.profileImage} alt="Profile" className="w-10 h-10 rounded-full" /> : <User size={24} />}</td>
                <td className="p-3">{testimony.name}</td>
                <td className="p-3">{testimony.message}</td>
                <td className="p-3">{testimony.status}</td>
                <td className="p-3">
                  <button onClick={() => approveTestimony(testimony.id)} className="text-green-500"><Check /></button>
                  <button onClick={() => rejectTestimony(testimony.id)} className="text-yellow-500"><XCircle /></button>
                  <button onClick={() => deleteTestimony(testimony.id)} className="text-red-500"><Trash2 /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
