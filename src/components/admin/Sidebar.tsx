"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebaseConfig";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, BookOpen, Calendar, Users, Settings,
  BarChart, Video, MessageCircle, Heart, ClipboardList,
  Newspaper, FileText, Home, HandCoins, Image as GalleryIcon,
  Megaphone, Quote, Menu, X, FilePlus
} from "lucide-react";

// ✅ Sidebar Items - Organized by Sections
const sidebarItems = [
  { section: "Main", items: [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  ]},

  { section: "Content Management", items: [
    { name: "Sermon Notes", href: "/admin/dashboard/sermon-notes", icon: BookOpen },
    { name: "Livestreams", href: "/admin/dashboard/livestreams", icon: Video },
    { name: "Blogs", href: "/admin/dashboard/blogs", icon: Newspaper },
    { name: "Books", href: "/admin/dashboard/books", icon: FileText },
    { name: "Gallery", href: "/admin/dashboard/gallery", icon: GalleryIcon },
  ]},

  { section: "Engagement & Social", items: [
    { name: "Events", href: "/admin/dashboard/events", icon: Calendar },
    { name: "Social", href: "/admin/dashboard/social", icon: MessageCircle },
    { name: "Prayer Wall", href: "/admin/dashboard/prayer-wall", icon: Heart },
    { name: "Testimonies", href: "/admin/dashboard/testimonies", icon: Quote },
    { name: "Announcements", href: "/admin/dashboard/announcements", icon: Megaphone },
  ]},

  { section: "Community & Management", items: [
    { name: "Service Attendance", href: "/admin/dashboard/attendance", icon: ClipboardList },
    { name: "Members", href: "/admin/dashboard/members", icon: Users },
    { name: "Homecell", href: "/admin/dashboard/homecell", icon: Home },
    { name: "Giving", href: "/admin/dashboard/giving", icon: HandCoins },
    { name: "Analytics & Charts", href: "/admin/dashboard/charts", icon: BarChart },
  ]},

  { section: "Website & Navigation", items: [
    { name: "Pages", href: "/admin/dashboard/pages", icon: FilePlus },
    { name: "Menus & Submenus", href: "/admin/dashboard/menus", icon: Menu },
  ]},

  { section: "Settings", items: [
    { name: "Settings", href: "/admin/dashboard/settings", icon: Settings },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // For mobile menu toggle

  // ✅ Fetch the logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Logout function
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <>
      {/* ✅ Mobile Menu Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 p-2 rounded-full text-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* ✅ Sidebar Container */}
      <aside 
        className={`fixed lg:relative z-40 lg:z-auto w-64 bg-gray-800 h-screen lg:h-full p-4 flex flex-col justify-between transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-64"
        } lg:translate-x-0`}
      >
        {/* ✅ Header: Church Logo & Name */}
        <div className="text-center mb-6 flex flex-col items-center">
          <Image src="/logo.png" alt="Church Logo" width={50} height={50} className="mb-2" />
          <h2 className="text-xl font-bold text-white">The Light's House</h2>
        </div>

        {/* ✅ Navigation Links */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-3">
            {sidebarItems.map((section) => (
              <li key={section.section}>
                {/* ✅ Section Title */}
                <h3 className="text-gray-400 text-sm uppercase font-semibold px-2 mt-4">{section.section}</h3>
                {section.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link 
                      key={item.name} 
                      href={item.href} 
                      className={`flex items-center p-3 rounded-lg transition ${
                        pathname === item.href ? "bg-red-600 text-white" : "hover:bg-gray-700 text-gray-300"
                      }`}
                    >
                      <IconComponent size={20} className="mr-3" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </li>
            ))}
          </ul>
        </nav>

        {/* ✅ User Info & Logout */}
        {user && (
          <div className="mt-6 border-t border-gray-600 pt-4 text-center">
            <p className="text-white text-sm">Logged in as <strong>{user.displayName || "Admin"}</strong></p>
            <button 
              onClick={handleLogout} 
              className="w-full mt-3 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* ✅ Overlay for Mobile Menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
