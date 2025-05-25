// src/components/Navbar.tsx
"use client";

import React, { useState, useEffect, useRef, MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/config/firebaseConfig";
import {
  Menu,
  X,
  ChevronDown,
  ShoppingCart,
  LogIn,
  LogOut,
  Megaphone,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  path: string;
  submenus?: Array<{ name: string; path?: string }>;
  order: number;
}

interface Announcement {
  id: string;
  message: string;
  expiryDate?: Date;
}

interface UserData {
  uid: string;
  displayName: string;
  photoURL: string;
  role: string;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [clientRendered, setClientRendered] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch menus, announcements, auth state
  useEffect(() => {
    setClientRendered(true);
    fetchMenus();
    fetchAnnouncements();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        const role = snap.data()?.role || "user";
        setUserData({
          uid: user.uid,
          displayName: user.displayName || "User",
          photoURL: user.photoURL || "/avatar-placeholder.png",
          role,
        });
      } else {
        setUserData(null);
      }
    });
    return () => unsub();
  }, []);

  // Cycle announcements
  useEffect(() => {
    if (announcements.length > 1) {
      const iv = setInterval(() => {
        setCurrentIndex((i) => (i + 1) % announcements.length);
      }, 5000);
      return () => clearInterval(iv);
    }
  }, [announcements]);

  // Close profile menu when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent<Document>) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside as any);
    return () => document.removeEventListener("mousedown", onClickOutside as any);
  }, []);

  if (!clientRendered) return null;

  async function fetchMenus() {
    try {
      const snap = await getDocs(collection(db, "menus"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
        path: d.data().path || "#",
        submenus: (d.data().submenus as any) || [],
        order: d.data().order ?? 99,
      }));
      setMenus(list.sort((a, b) => a.order - b.order));
    } catch (err) {
      console.error("Error fetching menus:", err);
    }
  }

  async function fetchAnnouncements() {
    try {
      const now = new Date();
      const q = query(
        collection(db, "announcements"),
        orderBy("expiryDate", "desc"),
        where("expiryDate", ">", now)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({
        id: d.id,
        message: d.data().message,
        expiryDate: (d.data().expiryDate as any).toDate(),
      }));
      setAnnouncements(
        list.length
          ? list
          : [{ id: "default", message: "Welcome to The Light's House – Join us this Sunday!" }]
      );
    } catch (err) {
      console.error("Error fetching announcements:", err);
    }
  }

  return (
    <>
      {/* Spacer to push content below fixed navbar */}
      <div className="h-20" />

      <div className="w-full fixed top-0 left-0 z-50">
        {announcements.length > 0 && (
          <div className="bg-red-600 text-white py-1 flex items-center justify-center text-sm">
            <Megaphone size={16} className="mr-2" />
            {announcements[currentIndex].message}
          </div>
        )}

        <nav className="bg-gray-900 text-white p-4 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.png" alt="Logo" width={50} height={50} />
              <span className="text-xl font-bold">The Light's House</span>
            </Link>

            {/* Mobile menu toggle */}
            <button className="lg:hidden" onClick={() => setIsOpen((o) => !o)}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Main links */}
            <div className={`lg:flex ${isOpen ? "block" : "hidden"} lg:items-center space-x-6`}>
              {menus.map((menu) => (
                <div
                  key={menu.id}
                  className="relative"
                  onMouseEnter={() => setDropdownOpen(menu.id)}
                  onMouseLeave={() => setDropdownOpen(null)}
                >
                  {menu.submenus && menu.submenus.length > 0 ? (
                    <>
                      {/* Parent button */}
                      <button className="flex items-center hover:text-red-500 transition">
                        {menu.name}
                        <ChevronDown size={16} className="ml-1" />
                      </button>

                      {/* Dropdown itself also keeps the same hover handlers */}
                      {dropdownOpen === menu.id && (
                        <div
                          onMouseEnter={() => setDropdownOpen(menu.id)}
                          onMouseLeave={() => setDropdownOpen(null)}
                          className="
                            absolute left-0 mt-2 bg-gray-800 rounded-lg shadow-xl
                            py-2 z-50 min-w-[12rem] pointer-events-auto transition-opacity duration-200"
                        >
                          {menu.submenus.map((sub, i) => (
                            <Link
                              key={i}
                              href={sub.path || "#"}
                              className="
                                block px-5 py-2 whitespace-nowrap
                                text-gray-200 hover:bg-gray-700 hover:text-white
                                transition-colors"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={menu.path} className="hover:text-red-500 transition">
                      {menu.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Cart and profile */}
            <div className="flex items-center space-x-4">
              <Link href="/shop">
                <ShoppingCart size={24} className="hover:text-red-500" />
              </Link>

              {userData ? (
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setProfileOpen((o) => !o)} className="flex items-center gap-2">
                    <Image
                      src={userData.photoURL}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="rounded-full border"
                    />
                    <ChevronDown size={16} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 bg-gray-800 w-48 rounded-lg shadow-lg z-50">
                      <div className="px-4 py-2 border-b border-gray-600 text-white text-sm">
                        <p className="font-semibold">{userData.displayName}</p>
                        <p className="text-xs capitalize">{userData.role}</p>
                      </div>
                      <ul>
                        <li>
                          <Link href="/profile" className="block px-4 py-2 hover:bg-gray-700">
                            Profile
                          </Link>
                        </li>
                        {userData.role === "admin" && (
                          <li>
                            <Link href="/admin/dashboard" className="block px-4 py-2 hover:bg-gray-700">
                              Admin Dashboard
                            </Link>
                          </li>
                        )}
                        <li>
                          <Link href="/settings" className="block px-4 py-2 hover:bg-gray-700">
                            Settings
                          </Link>
                        </li>
                        <li>
                          <button
                            onClick={async () => {
                              await signOut(auth);
                              router.push("/");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-2"
                          >
                            <LogOut size={16} /> Logout
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login">
                  <LogIn size={24} className="hover:text-red-500" />
                </Link>
              )}
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
