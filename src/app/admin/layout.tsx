"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/auth/login"); // Redirect if not logged in
        return;
      }

      // 🔹 Fetch User Role
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.data()?.role || "user";

      if (role === "admin") {
        setIsAdmin(true);
      } else {
        router.push("/"); // Redirect non-admin users
      }

      setLoading(false);
    };

    checkAdmin();
  }, [router]);

  if (loading) return <div className="h-screen flex items-center justify-center text-white">Checking access...</div>;

  return isAdmin ? (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-4 overflow-y-auto">{children}</div>
    </div>
  ) : null;
}
