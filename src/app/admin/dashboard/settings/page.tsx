"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { getAuth, updatePassword } from "firebase/auth";
import { db, storage } from "@/config/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  Save,
  Upload,
  Download,
  Globe,
  Shield,
  Bell,
  Users,
  Settings as SettingsIcon,
  PaintBucket,
  Lock,
  Calendar as CalendarIcon,
  Gift,
  Clock,
  Youtube,
  Facebook,
  BarChart,
} from "lucide-react";
import withRoleProtection from "@/components/auth/withRoleProtection";

interface LoginEntry { [key: string]: any; }
interface User { id: string; [key: string]: any; }

interface SettingsType {
  churchName: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  language: string;
  availableLanguages: string[];
  theme: string;
  primaryColor: string;
  font: string;
  enableNotifications: boolean;
  enableEmailNotifications: boolean;
  enablePushNotifications: boolean;
  enableSMSNotifications: boolean;
  enable2FA: boolean;
  loginHistory: LoginEntry[];
  newPassword: string;
  users: User[];
  selectedUserRole: string;
  roles: string[];
  rolePermissions: Record<string, string[]>;
  homepageBanner: {
    title: string;
    subtitle: string;
    mediaType: "image" | "video";
    mediaUrl: string;
  };
  websiteStatus: "online" | "maintenance";
  maintenanceMessage: string;
  countdownTimer: string;
  enableOnlineGiving: boolean;
  paymentMethods: string[];
  enableAnalytics: boolean;
  googleAnalyticsKey: string | null;
  enableLiveStreaming: boolean;
  youtubeApiKey: string | null;
  facebookApiKey: string | null;
  customStreamLink: string | null;
}

const initialSettings: SettingsType = {
  churchName: "",
  logoUrl: "",
  contactEmail: "",
  contactPhone: "",
  language: "English",
  availableLanguages: ["English", "Spanish", "French", "German", "Chinese", "Arabic"],
  theme: "light",
  primaryColor: "#ff0000",
  font: "Inter",
  enableNotifications: true,
  enableEmailNotifications: true,
  enablePushNotifications: true,
  enableSMSNotifications: false,
  enable2FA: false,
  loginHistory: [],
  newPassword: "",
  users: [],
  selectedUserRole: "member",
  roles: ["admin", "coAdmin", "leader", "member"],
  rolePermissions: {
    admin: ["all"],
    coAdmin: ["manageUsers", "viewAnalytics"],
    leader: ["viewReports", "manageHomecells"],
    member: ["viewContent"],
  },
  homepageBanner: {
    title: "Welcome to The Light's House",
    subtitle: "A place of faith and transformation",
    mediaType: "image",
    mediaUrl: "/default-banner.jpg",
  },
  websiteStatus: "online",
  maintenanceMessage: "We’ll be back soon!",
  countdownTimer: "",
  enableOnlineGiving: true,
  paymentMethods: ["PayPal", "Stripe"],
  enableAnalytics: true,
  googleAnalyticsKey: null,
  enableLiveStreaming: false,
  youtubeApiKey: null,
  facebookApiKey: null,
  customStreamLink: null,
};

function SettingsPage() {
  const [settings, setSettings] = useState<SettingsType>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>("");
  const [roleLoading, setRoleLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [bannerUploadProgress, setBannerUploadProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"general"|"security"|"users"|"theme">("general");

  useEffect(() => {
    fetchSettings();
    fetchUsers();
    fetchUserRole();
    fetchLoginHistory();
  }, []);

  // Fetch general config
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "settings", "config"));
      if (snap.exists()) {
        setSettings((prev) => ({
          ...prev,
          ...(snap.data() as Partial<SettingsType>),
        }));
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch login history
  const fetchLoginHistory = async () => {
    try {
      const snap = await getDocs(collection(db, "loginHistory"));
      const history: LoginEntry[] = snap.docs.map((d) => d.data());
      setSettings((prev) => ({ ...prev, loginHistory: history }));
    } catch (err) {
      console.error("Error fetching login history:", err);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list: User[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setSettings((prev) => ({ ...prev, users: list }));
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Fetch current user role
  const fetchUserRole = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      setRole(snap.exists() ? (snap.data()?.role as string) : "");
    } catch (err) {
      console.error("Error fetching user role:", err);
    } finally {
      setRoleLoading(false);
    }
  };

  // Save general settings
  const saveSettings = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "settings", "config"), {
        churchName: settings.churchName,
        logoUrl: settings.logoUrl,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        language: settings.language,
        theme: settings.theme,
        primaryColor: settings.primaryColor,
        font: settings.font,
        enableNotifications: settings.enableNotifications,
        enableEmailNotifications: settings.enableEmailNotifications,
        enablePushNotifications: settings.enablePushNotifications,
        enableSMSNotifications: settings.enableSMSNotifications,
        enable2FA: settings.enable2FA,
      });
      alert("General settings saved!");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  // Change user password
  const changePassword = async () => {
    if (!settings.newPassword) {
      alert("Enter a new password");
      return;
    }
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("No user");
      await updatePassword(user, settings.newPassword);
      setSettings((prev) => ({ ...prev, newPassword: "" }));
      alert("Password changed");
    } catch (err) {
      console.error("Error changing password:", err);
      alert("Failed to change password");
    }
  };

  // Upload church logo
  const uploadLogo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const task = uploadBytesResumable(ref(storage, `logos/${file.name}`), file);
    task.on("state_changed",
      (snap) => setUploadProgress((snap.bytesTransferred/snap.totalBytes)*100),
      console.error,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setSettings((prev) => ({ ...prev, logoUrl: url }));
        setUploadProgress(0);
      }
    );
  };

  // Upload homepage banner
  const handleBannerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg","image/png","image/gif","video/mp4"].includes(file.type)) {
      alert("Invalid file type");
      return;
    }
    const task = uploadBytesResumable(ref(storage, `banners/${file.name}`), file);
    task.on("state_changed",
      (snap) => setBannerUploadProgress((snap.bytesTransferred/snap.totalBytes)*100),
      console.error,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setSettings((prev) => ({
          ...prev,
          homepageBanner: { ...prev.homepageBanner, mediaUrl: url },
        }));
        setBannerUploadProgress(0);
      }
    );
  };

  // Save homepage banner
  const saveBannerSettings = async () => {
    if (!settings.homepageBanner.title || !settings.homepageBanner.mediaUrl) {
      alert("Complete banner fields");
      return;
    }
    try {
      await updateDoc(doc(db, "settings", "config"), {
        homepageBanner: settings.homepageBanner,
      });
      alert("Banner saved");
    } catch (err) {
      console.error("Error saving banner:", err);
      alert("Failed to save banner");
    }
  };

  // Update a user's role
  const updateUserRole = async (userId: string) => {
    const newRole = settings.selectedUserRole;
    if (!settings.roles.includes(newRole)) {
      alert("Invalid role");
      return;
    }
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setSettings((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === userId ? { ...u, role: newRole } : u
        ),
      }));
      alert("Role updated");
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Failed to update role");
    }
  };

  // Tab definitions
  const tabs = [
    { id: "general", label: "General" },
    { id: "security", label: "Security", roles: ["admin","coAdmin"] },
    { id: "users", label: "User Mgmt", roles: ["admin"] },
    { id: "theme", label: "Theme" },
  ];

  if (roleLoading) {
    return <p className="text-gray-400">Loading settings...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold flex items-center">
        <SettingsIcon className="mr-2" /> Settings
      </h1>

      {/* Tab Nav */}
      <div className="flex space-x-4 mt-4 border-b border-gray-700 pb-2">
        {tabs
          .filter((t) => !t.roles || t.roles.includes(role))
          .map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded ${
                activeTab === t.id ? "bg-gray-700" : "bg-gray-800"
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "general" && (
          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">General</h2>
            <input
              type="text"
              placeholder="Church Name"
              value={settings.churchName}
              onChange={(e) =>
                setSettings({ ...settings, churchName: e.target.value })
              }
              className="p-2 bg-gray-700 rounded w-full mb-2"
            />
            <input
              type="file"
              accept="image/*"
              onChange={uploadLogo}
              className="mb-2"
            />
            {uploadProgress > 0 && (
              <div className="w-full bg-gray-600 rounded">
                <div
                  className="bg-green-500 text-center text-white text-xs p-1 rounded"
                  style={{ width: `${uploadProgress}%` }}
                >
                  {Math.round(uploadProgress)}%
                </div>
              </div>
            )}
            <button
              onClick={saveSettings}
              disabled={loading}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded flex items-center"
            >
              <Save className="mr-2" /> {loading ? "Saving..." : "Save"}
            </button>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2">Security</h2>
            <label className="block text-gray-400 mb-1">New Password</label>
            <input
              type="password"
              value={settings.newPassword}
              onChange={(e) =>
                setSettings({ ...settings, newPassword: e.target.value })
              }
              className="p-2 bg-gray-700 rounded w-full mb-2"
            />
            <button
              onClick={changePassword}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              <Lock className="mr-2" /> Change Password
            </button>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <Users className="mr-2" /> User Management
            </h2>
            <label className="block text-gray-400 mb-1">Select Role</label>
            <select
              value={settings.selectedUserRole}
              onChange={(e) =>
                setSettings({ ...settings, selectedUserRole: e.target.value })
              }
              className="p-2 bg-gray-700 rounded w-full mb-2"
            >
              {settings.roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ul className="text-gray-300">
              {settings.users.map((u) => (
                <li
                  key={u.id}
                  className="p-2 bg-gray-700 rounded mb-1 flex justify-between"
                >
                  <span>
                    {u.name || u.email} — {u.role}
                  </span>
                  <button
                    onClick={() => updateUserRole(u.id)}
                    className="text-blue-400 underline"
                  >
                    Change Role
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "theme" && (
          <div className="bg-gray-800 p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <PaintBucket className="mr-2" /> Theme & Appearance
            </h2>
            <label className="block text-gray-400 mb-1">Theme</label>
            <select
              value={settings.theme}
              onChange={(e) =>
                setSettings({ ...settings, theme: e.target.value })
              }
              className="p-2 bg-gray-700 rounded w-full mb-3"
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
            <label className="block text-gray-400 mb-1">Primary Color</label>
            <input
              type="color"
              value={settings.primaryColor}
              onChange={(e) =>
                setSettings({ ...settings, primaryColor: e.target.value })
              }
              className="p-2 bg-gray-700 rounded w-full mb-3"
            />
            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-green-600 text-white rounded flex items-center"
            >
              <Save className="mr-2" /> Save Theme
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default withRoleProtection(SettingsPage, ["admin"]);
