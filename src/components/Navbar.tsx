"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { Menu, X, ChevronDown, ShoppingCart, User, LogIn, LogOut, Megaphone } from "lucide-react";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menus, setMenus] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [clientRendered, setClientRendered] = useState(false); // ✅ Prevent hydration issues

  // ✅ Mark Component as Client-Rendered
  useEffect(() => {
    setClientRendered(true);
    fetchMenus();
    fetchAnnouncements();
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
        orderBy("expiryDate", "desc"), // Ensure ordering before filtering
        where("expiryDate", ">", now) // Show only active announcements
      );
      const querySnapshot = await getDocs(q);

      const annList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          message: data.message,
          expiryDate: data.expiryDate.toDate(), // Convert Firestore timestamp to Date
        };
      });

      console.log("🔍 Retrieved Announcements:", annList); // Debugging log
      setAnnouncements(annList.length ? annList : [{ id: "default", message: "Welcome to The Light's House - Join us this Sunday!" }]);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  // ✅ Auto-scroll Announcements
  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, 5000); // Change every 5 seconds
      return () => clearInterval(interval);
    }
  }, [announcements]);

  // 🚀 **Prevent Render Until Fully Loaded**
  if (!clientRendered) return null;

  return (
    <div className="w-full">
      {/* ✅ Top Announcement Bar (Auto-scrolling) */}
      {announcements.length > 0 && (
        <div className="bg-red-600 text-white text-center py-2 flex items-center justify-center transition-opacity duration-500">
          <Megaphone size={18} className="mr-2" />
          <p className="text-sm">{announcements[currentIndex]?.message}</p>
        </div>
      )}

      {/* ✅ Main Navigation Bar */}
      <nav className="bg-gray-900 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* ✅ Church Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="Church Logo" width={40} height={40} />
            <span className="text-xl font-bold">The Light's House</span>
          </Link>

          {/* ✅ Mobile Menu Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* ✅ Navigation Menu */}
          <div className={`lg:flex ${isOpen ? "block" : "hidden"} lg:items-center space-x-6 transition-all duration-300`}>
            {menus.map((menu) => (
              <div key={menu.id} className="relative group" 
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
                      {menu.name} <ChevronDown size={18} className="ml-1" />
                    </button>
                    <div 
                      className={`absolute left-0 mt-2 bg-gray-800 shadow-lg rounded-md py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-300`}
                    >
                      {menu.submenus.map((submenu, index) => (
                        <Link key={index} href={submenu.path || "#"} className="block px-4 py-2 hover:bg-gray-700 transition">
                          {submenu.name}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* ✅ Icons: Shop, Login, Logout, User Profile */}
          <div className="flex items-center space-x-4">
            <Link href="/shop">
              <ShoppingCart size={24} className="hover:text-red-500 transition cursor-pointer" />
            </Link>
            {isLoggedIn ? (
              <>
                <Link href="/profile">
                  <User size={24} className="hover:text-red-500 transition cursor-pointer" />
                </Link>
                <button onClick={() => setIsLoggedIn(false)}>
                  <LogOut size={24} className="hover:text-red-500 transition cursor-pointer" />
                </button>
              </>
            ) : (
              <button onClick={() => setIsLoggedIn(true)}>
                <LogIn size={24} className="hover:text-red-500 transition cursor-pointer" />
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}
