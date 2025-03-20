"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists() && userSnap.data().role === "admin") {
            setIsAdmin(true);
          } else {
            router.push("/"); // Redirect to homepage if not admin
          }
        } else {
          router.push("/auth/login");
        }
        setLoading(false);
      });
    };
    checkAuth();
  }, [router]);

  if (loading) return <p className="text-center text-white">Checking authentication...</p>;

  return isAdmin ? <>{children}</> : null;
}
