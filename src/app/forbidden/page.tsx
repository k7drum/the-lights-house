// src/app/admin/layout.tsx
"use client";

import React, { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Sidebar from "@/components/admin/Sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

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

    ["mousemove", "keydown", "scroll", "click"].forEach((evt) =>
      window.addEventListener(evt, resetTimer)
    );

    resetTimer();

    return () => {
      clearTimeout(timer);
      ["mousemove", "keydown", "scroll", "click"].forEach((evt) =>
        window.removeEventListener(evt, resetTimer)
      );
    };
  }, [router, timeout]);
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Enable inactivity logout
  useInactivityLogout();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // not logged in
        router.push("/auth/login");
        setLoading(false);
        return;
      }

      try {
        // fetch role from Firestore
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.data()?.role || "user";

        if (role === "admin") {
          setIsAdmin(true);
        } else {
          // logged in but not admin
          router.push("/forbidden");
        }
      } catch (err) {
        console.error("Error checking admin role:", err);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Checking access...
      </div>
    );
  }

  if (!isAdmin) {
    // once loading is done, if not admin we already redirected, so render nothing
    return null;
  }

  // only admin sees the sidebar + children
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  );
}
