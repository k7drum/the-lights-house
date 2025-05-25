// src/app/admin/layout.tsx
"use client";

import React, { ReactNode, useEffect, useState } from "react";
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
        auth.signOut().then(() => router.replace("/auth/login"));
      }, timeout);
    };
    ["mousemove", "keydown", "scroll", "click"].forEach((e) =>
      window.addEventListener(e, resetTimer)
    );
    resetTimer();
    return () => {
      clearTimeout(timer);
      ["mousemove", "keydown", "scroll", "click"].forEach((e) =>
        window.removeEventListener(e, resetTimer)
      );
    };
  }, [router, timeout]);
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // enable inactivity logout
  useInactivityLogout();

  useEffect(() => {
    // subscribe to auth changes
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // not logged in → go to login
        router.replace("/auth/login");
        return;
      }
      try {
        // check role
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.data()?.role;
        if (role === "admin") {
          setIsAdmin(true);
        } else {
          // logged in but not admin → forbidden
          router.replace("/forbidden");
        }
      } catch (err) {
        console.error("Checking admin role failed:", err);
        router.replace("/auth/login");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Checking access…
      </div>
    );
  }

  // only render children if admin
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-4 overflow-y-auto">{children}</main>
    </div>
  );
}
