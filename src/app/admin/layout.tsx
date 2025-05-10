"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Sidebar from "@/components/admin/Sidebar";

// 🔹 Inactivity logout hook (15 mins)
function useInactivityLogout(timeout = 15 * 60 * 1000) {
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        alert("You have been logged out due to inactivity.");
        auth.signOut().then(() => {
          router.push("/auth/login");
        });
      }, timeout);
    };

    const events = ["mousemove", "keydown", "scroll", "click"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer(); // Start on load

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [router, timeout]);
}

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // ✅ Enable inactivity logout
  useInactivityLogout();

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.data()?.role || "user";

      if (role === "admin") {
        setIsAdmin(true);
      } else {
        router.push("/");
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
