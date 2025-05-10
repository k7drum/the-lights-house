"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/config/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  Menu, X, ChevronDown, ShoppingCart, User, LogIn, LogOut, Megaphone,
} from "lucide-react";
import Image from "next/image";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [clientRendered, setClientRendered] = useState(false);
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  const profileRef = useRef(null);

  useEffect(() => {
    setClientRendered(true);
    fetchMenus();
    fetchAnnouncements();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        setUserData({
          uid: user.uid,
          displayName: user.displayName || "User",
          photoURL: user.photoURL || "/avatar-placeholder.png",
          role: userDoc.data()?.role || "user",
        });
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchMenus = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "menus"));
      const menuList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        path: doc.data().path || "#",
        submenus: doc.data().submenus || [],
        order: doc.data().order || 99,
      }));
      setMenus(menuList.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Error fetching menus:", error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const now = new Date();
      const q = query(
        collection(db, "announcements"),
        orderBy("expiryDate", "desc"),
        where("expiryDate", ">", now)
      );
      const querySnapshot = await getDocs(q);
      const annList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        message: doc.data().message,
        expiryDate: doc.data().expiryDate.toDate(),
      }));

      setAnnouncements(
        annList.length
          ? annList
          : [{ id: "default", message: "Welcome to The Light's House - Join us this Sunday!" }]
      );
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [announcements]);

  // ✅ Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!clientRendered) return null;

  return (
    <div className="w-full">
      {/* 🔔 Announcement Bar */}
      {announcements.length > 0 && (
        <div className="bg-red-600 text-white text-center py-2 flex items-center justify-center">
          <Megaphone size={18} className="mr-2" />
          <p className="text-sm">{announcements[currentIndex]?.message}</p>
        </div>
      )}

      {/* 🔗 Navbar */}
      <nav className="bg-gray-900 text-white p-4 shadow-md z-40 relative">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="Logo" width={70} height={70} />
            <span className="text-xl font-bold">The Light's House</span>
          </Link>

          {/* Mobile Menu */}
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Menus */}
          <div className={`lg:flex ${isOpen ? "block" : "hidden"} lg:items-center space-x-6 transition-all`}>
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="relative group"
                onMouseEnter={() => setDropdownOpen(menu.name)}
                onMouseLeave={() => setDropdownOpen("")}
              >
                {!menu.submenus || menu.submenus.length === 0 ? (
                  <Link href={menu.path} className="hover:text-red-500 transition">
                    {menu.name}
                  </Link>
                ) : (
                  <>
                    <button className="flex items-center hover:text-red-500">
                      {menu.name}
                      <ChevronDown size={18} className="ml-1" />
                    </button>
                    <div className="absolute left-0 mt-2 bg-gray-800 shadow-lg rounded-md py-2 w-48 opacity-0 group-hover:opacity-100 pointer-events-auto group-hover:pointer-events-auto transition-all duration-300 z-50">
                      {menu.submenus.map((submenu, index) => (
                        <Link key={index} href={submenu.path || "#"} className="block px-4 py-2 hover:bg-gray-700">
                          {submenu.name}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Icons & Auth */}
          <div className="flex items-center space-x-4 relative">
            <Link href="/shop">
              <ShoppingCart size={24} className="hover:text-red-500" />
            </Link>

            {userData ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => setProfileOpen((prev) => !prev)} className="flex items-center gap-2">
                  <Image
                    src={userData.photoURL}
                    alt="User"
                    width={32}
                    height={32}
                    className="rounded-full border"
                  />
                  <ChevronDown size={18} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 bg-gray-800 w-48 rounded shadow-lg z-50 animate-fade-in">
                    <div className="px-4 py-2 text-sm text-white border-b border-gray-600">
                      <p className="font-semibold">{userData.displayName}</p>
                      <p className="text-xs text-gray-400 capitalize">{userData.role}</p>
                    </div>
                    <ul className="text-sm">
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
                          className="w-full text-left px-4 py-2 hover:bg-gray-700"
                        >
                          Logout
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
  );
}
