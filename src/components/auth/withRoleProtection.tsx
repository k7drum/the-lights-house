"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Loader } from "lucide-react";

export default function withRoleProtection(Component: any, allowedRoles: string[] = []) {
  return function ProtectedComponent(props: any) {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (!user) {
          router.push("/auth/login"); // Redirect if not logged in
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const role = userDoc.data()?.role || "user";

          if (allowedRoles.includes(role)) {
            setAuthorized(true);
          } else {
            router.push("/forbidden"); // 🚨 Redirect unauthorized users
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          router.push("/forbidden");
        }

        setLoading(false);
      });

      return () => unsubscribe(); // Cleanup listener
    }, [router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <Loader size={48} className="animate-spin" />
          <p className="ml-4">Checking permissions...</p>
        </div>
      );
    }

    return authorized ? <Component {...props} /> : null;
  };
}
