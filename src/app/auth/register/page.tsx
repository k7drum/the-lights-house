"use client";
import { useState } from "react";
import { auth, db } from "@/config/firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    maritalStatus: "single",
    role: "member",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const { name, email, password, phone, address, maritalStatus, role } = formData;

    // ✅ Validate Inputs
    if (!name || !email || !password || !phone || !address) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      console.log("🔹 Creating user...");

      // ✅ Create User in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("✅ User created:", user);

      // ✅ Update User Profile (Display Name)
      await updateProfile(user, { displayName: name });

      // ✅ Store User Data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        phone,
        address,
        maritalStatus,
        role,
        createdAt: serverTimestamp(),
      });

      console.log("✅ User data stored in Firestore");

      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: any) {
      console.error("❌ Registration Error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-white">Register</h2>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* ✅ Full Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />

          {/* ✅ Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />

          {/* ✅ Password */}
          <input
            type="password"
            name="password"
            placeholder="Password (min. 6 characters)"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />

          {/* ✅ Phone Number */}
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />

          {/* ✅ Address */}
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          />

          {/* ✅ Marital Status */}
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          >
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>

          {/* ✅ Role Selection */}
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-700 text-white"
            required
          >
            <option value="member">Member</option>
            <option value="pastorate">Pastorate</option>
            <option value="leader">Leader</option>
          </select>

          {/* ✅ Register Button */}
          <button type="submit" className="w-full bg-red-600 py-2 rounded text-white font-bold" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* ✅ Redirect to Login */}
        <p className="text-gray-400 text-sm mt-3 text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-red-500 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
