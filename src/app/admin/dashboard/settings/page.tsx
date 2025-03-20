"use client";
import { useState, useEffect } from "react";
import { db, storage } from "@/config/firebaseConfig";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // ✅ Import Firebase Storage
import { Save, Upload, Download, Globe, Shield, Bell, Users, Settings, PaintBucket, Lock, Calendar, Gift, Clock, Youtube, Facebook, BarChart } from "lucide-react";

// ✅ Initial State
const initialSettings = {
  churchName: "",
  logoUrl: "",
  contactEmail: "",
  contactPhone: "",
  language: "English",
  availableLanguages: ["English", "Spanish", "French", "German", "Chinese", "Arabic"], // Language options
  theme: "light",
  primaryColor: "#ff0000",
  font: "Inter", // Default font
  enableNotifications: true,
  enableEmailNotifications: true,
  enablePushNotifications: true,
  enableSMSNotifications: false,
  enable2FA: false,
  loginHistory: [],
  newPassword: "", // Temporary storage for new password input
  users: [],
  selectedUserRole: "member", // Default role selection
  roles: ["admin", "coAdmin", "leader", "member"], // Available roles
  rolePermissions: {
    admin: ["all"],
    coAdmin: ["manageUsers", "viewAnalytics"],
    leader: ["viewReports", "manageHomecells"],
    member: ["viewContent"],
  },
  homepageBanner: {
    title: "Welcome to The Light's House",
    subtitle: "A place of faith and transformation",
    mediaType: "image", // "image" or "video"
    mediaUrl: "/default-banner.jpg",
  },
  websiteStatus: "online",
  maintenanceMessage: "We’ll be back soon!",
  countdownTimer: "",
  enableOnlineGiving: true,
  paymentMethods: ["PayPal", "Stripe"],
  enableAnalytics: true,
  googleAnalyticsKey: "",
  enableLiveStreaming: false, // Toggle live streaming
  youtubeApiKey: "",
  facebookApiKey: "",
  customStreamLink: "", // Custom stream URL
};

// ✅ Settings Page Component
export default function SettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Track upload percentage

  // ✅ Fetch Settings from Firestore
  useEffect(() => {
    fetchSettings();
    fetchUsers();
    document.documentElement.setAttribute("data-theme", settings.theme);
    document.documentElement.style.setProperty("--primary-color", settings.primaryColor);
    document.documentElement.style.fontFamily = settings.font;

    const interval = setInterval(() => {
      if (settings.websiteStatus === "maintenance") {
        setSettings((prev) => ({ ...prev }));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [settings.websiteStatus, settings.countdownTimer, settings.theme, settings.primaryColor, settings.font]);

  const fetchLoginHistory = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "loginHistory"));
      const history = querySnapshot.docs.map((doc) => doc.data());
      setSettings((prev) => ({ ...prev, loginHistory: history }));
    } catch (error) {
      console.error("Error fetching login history:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "settings", "config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings((prev) => ({ ...prev, ...docSnap.data() }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };
  


  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSettings((prev) => ({ ...prev, users: userList }));
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  

  // ✅ Save Updated Settings
  const saveSettings = async () => {
    try {
      setLoading(true);
      await updateDoc(doc(db, "settings", "config"), {
        ...settings,
        bannerTitle: settings.bannerTitle || "Welcome to The Light's House",
        bannerSubtitle: settings.bannerSubtitle || "A place of faith and transformation",
        bannerMediaType: settings.bannerMediaType || "image",
        bannerMediaUrl: settings.bannerMediaUrl || "/default-banner.jpg",
      });
      alert("Settings Saved Successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setLoading(false);
    }
  };
  
  

  const calculateRemainingTime = () => {
    if (!settings.countdownTimer) return "No countdown set";
  
    const now = new Date();
    const maintenanceEnd = new Date(settings.countdownTimer);
    const difference = maintenanceEnd - now;
  
    if (difference <= 0) return "Maintenance Ended";
  
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  
    return `${hours}h ${minutes}m ${seconds}s remaining`;
  };
  

  const saveSecuritySettings = async () => {
    try {
      await updateDoc(doc(db, "settings", "config"), {
        enable2FA: settings.enable2FA,
      });
      alert("Security settings saved successfully!");
    } catch (error) {
      console.error("Error saving security settings:", error);
    }
  };

  const changePassword = async () => {
    if (!settings.newPassword) {
      alert("Please enter a new password.");
      return;
    }
  
    try {
      // Simulate password change (replace with actual Firebase Auth logic)
      alert("Password updated successfully!");
      setSettings((prev) => ({ ...prev, newPassword: "" })); // Clear input field
    } catch (error) {
      console.error("Error updating password:", error);
    }
  };
  
  

  const saveThemeSettings = async () => {
    try {
      await updateDoc(doc(db, "settings", "config"), {
        theme: settings.theme,
        primaryColor: settings.primaryColor,
        font: settings.font,
      });
      alert("Theme settings saved successfully!");
    } catch (error) {
      console.error("Error saving theme settings:", error);
    }
  };
  

  const saveRolePermissions = async () => {
    try {
      await updateDoc(doc(db, "settings", "config"), {
        rolePermissions: settings.rolePermissions,
      });
      alert("Role permissions updated successfully!");
    } catch (error) {
      console.error("Error saving role permissions:", error);
    }
  };
  

  // ✅ Upload Church Logo
  const uploadLogo = async (file) => {
    if (!file) return;
    const storageRef = ref(storage, `logos/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    setSettings((prev) => ({ ...prev, logoUrl: url }));
  };

  // ✅ Export Settings as JSON File
  const exportSettings = () => {
    const settingsData = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsData], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "settings_backup.json";
    link.click();
  };

  // ✅ Import Settings from JSON File
  const importSettings = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        setSettings((prev) => ({ ...prev, ...importedData }));
        alert("Settings Imported Successfully!");
      } catch (error) {
        console.error("Error importing settings:", error);
        alert("Invalid JSON file!");
      }
    };
    reader.readAsText(file);
  };

  const updateUserRole = async (userId) => {
    const newRole = settings.selectedUserRole;
    if (!newRole) return alert("Please select a role first!");
  
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      setSettings((prev) => ({
        ...prev,
        users: prev.users.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        ),
      }));
      alert("User role updated successfully!");
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const hasPermission = (role, permission) => {
    return settings.rolePermissions[role]?.includes("all") || 
           settings.rolePermissions[role]?.includes(permission);
  };
  


  // ✅ Upload Banner Image or Video to Firebase Storage
  const handleBannerUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    try {
      setUploadProgress(0); // Reset progress bar
      const storageRef = ref(storage, `banners/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
  
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Calculate and update progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Error uploading banner:", error);
          alert("Failed to upload banner.");
        },
        async () => {
          // Get the download URL when upload is complete
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setSettings((prev) => ({
            ...prev,
            homepageBanner: { ...prev.homepageBanner, mediaUrl: url },
          }));
  
          setUploadProgress(0); // Hide progress bar after upload
          alert("Banner uploaded successfully!");
        }
      );
    } catch (error) {
      console.error("Error uploading banner:", error);
      alert("Failed to upload banner.");
    }
  };
  

// ✅ Save Banner Settings to Firestore
const saveBannerSettings = async () => {
  try {
    await updateDoc(doc(db, "settings", "config"), {
      homepageBanner: settings.homepageBanner,
    });
    alert("Banner settings saved!");
  } catch (error) {
    console.error("Error saving banner:", error);
    alert("Failed to save banner settings.");
  }
};

// ✅ Reset Banner to Default
const resetBannerToDefault = () => {
  setSettings((prev) => ({
    ...prev,
    homepageBanner: {
      title: "Welcome to The Light's House",
      subtitle: "A place of faith and transformation",
      mediaType: "image",
      mediaUrl: "/default-banner.jpg",
    },
  }));
};




  
// ✅ Upload Banner with Progress Bar
const uploadBanner = async (file) => {
  if (!file) {
    alert("Please select a file to upload.");
    return;
  }

  const storageRef = ref(storage, `media/${file.name}`); // ✅ Store in 'media/' folder
  const uploadTask = uploadBytesResumable(storageRef, file);

  setBannerUploadProgress(0); // Reset progress bar

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setBannerUploadProgress(progress.toFixed(0)); // Convert to percentage
    },
    (error) => {
      console.error("Upload failed:", error);
      alert("Failed to upload banner.");
    },
    async () => {
      const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

      // ✅ Save Media to Firestore
      const mediaRef = await addDoc(collection(db, "media"), {
        type: "banner",
        url: downloadUrl,
        uploadedAt: new Date(),
      });

      // ✅ Update Settings with the New Banner
      await updateDoc(doc(db, "settings", "config"), {
        homepageBanner: { mediaUrl: downloadUrl, mediaType: file.type.includes("video") ? "video" : "image" },
      });

      // ✅ Update UI State
      setSettings((prev) => ({
        ...prev,
        homepageBanner: { mediaUrl: downloadUrl, mediaType: file.type.includes("video") ? "video" : "image" },
      }));

      alert("Banner uploaded successfully!");
    }
  );
};




  // ✅ Reset to Default
  const resetSettings = () => {
    if (window.confirm("Are you sure you want to reset all settings to default?")) {
      setSettings(initialSettings);
      alert("Settings have been reset to default!");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold flex items-center">
        <Settings className="mr-2" /> Settings
      </h1>

      {/* ✅ General Settings */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">General Settings</h2>
        <input type="text" placeholder="Church Name" value={settings.churchName} onChange={(e) => setSettings({ ...settings, churchName: e.target.value })} className="p-2 bg-gray-700 rounded w-full mb-2" />
        <label className="block text-gray-400">Upload Logo</label>
        <input type="file" onChange={(e) => uploadLogo(e.target.files[0])} className="p-2 bg-gray-700 rounded w-full mb-2" />
      </div>

      {/* ✅ Language Selection */}
<div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold mb-2 flex items-center">
    <Globe className="mr-2" /> Language Selection
  </h2>
  <select
    value={settings.language}
    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
    className="p-2 bg-gray-700 rounded w-full mb-2"
  >
    {settings.availableLanguages.map((lang) => (
      <option key={lang} value={lang}>
        {lang}
      </option>
    ))}
  </select>
</div>

{/* ✅ User Management */}
<div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold mb-2 flex items-center">
    <Users className="mr-2" /> User Management
  </h2>

  <label className="block text-gray-400 mb-1">Select Role</label>
  <select
    value={settings.selectedUserRole}
    onChange={(e) => setSettings({ ...settings, selectedUserRole: e.target.value })}
    className="p-2 bg-gray-700 rounded w-full mb-2"
  >
    {settings.roles.map((role) => (
      <option key={role} value={role}>
        {role}
      </option>
    ))}
  </select>

  <h3 className="text-md font-semibold mt-4">Users List</h3>
  <ul className="text-gray-300 mt-2">
    {settings.users.length > 0 ? (
      settings.users.map((user) => (
        <li key={user.id} className="p-2 bg-gray-700 rounded mb-1 flex justify-between">
          <span>{user.name} - {user.role}</span>
          <button
            className="text-blue-400 underline"
            onClick={() => updateUserRole(user.id)}
          >
            Change Role
          </button>
        </li>
      ))
    ) : (
      <p className="text-gray-400">No users found.</p>
    )}
  </ul>
</div>






{/* ✅ Role-Based Permissions */}
<div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold mb-2 flex items-center">
    <Shield className="mr-2" /> Role-Based Permissions
  </h2>

  <p className="text-gray-400 text-sm mb-2">
    Assign permissions to each role. Use commas (,) to separate permissions.
  </p>

  {Object.keys(settings.rolePermissions).map((role) => (
    <div key={role} className="mb-3">
      <label className="block text-gray-400">{role.toUpperCase()}</label>
      <input
        type="text"
        placeholder={`Permissions for ${role}`}
        value={settings.rolePermissions[role].join(", ")}
        onChange={(e) =>
          setSettings({
            ...settings,
            rolePermissions: {
              ...settings.rolePermissions,
              [role]: e.target.value.split(",").map((p) => p.trim()),
            },
          })
        }
        className="p-2 bg-gray-700 rounded w-full"
      />
    </div>
  ))}
</div>


<button onClick={saveRolePermissions} className="mt-3 px-4 py-2 bg-green-600 rounded-lg text-white flex items-center">
  <Save className="mr-2" /> Save Permissions
</button>


{/* ✅ Website Status */}
<div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold mb-2 flex items-center">
    <Calendar className="mr-2" /> Website Status
  </h2>

  <select
    value={settings.websiteStatus}
    onChange={(e) => setSettings({ ...settings, websiteStatus: e.target.value })}
    className="p-2 bg-gray-700 rounded w-full mb-2"
  >
    <option value="online">Online</option>
    <option value="maintenance">Maintenance Mode</option>
  </select>

  {/* Custom Maintenance Message */}
  {settings.websiteStatus === "maintenance" && (
    <>
      <label className="block text-gray-400 mt-2">Maintenance Message</label>
      <textarea
        value={settings.maintenanceMessage}
        onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
        className="p-2 bg-gray-700 rounded w-full mb-2"
      />

      {/* Countdown Timer */}
      <label className="block text-gray-400">Set Maintenance End Time</label>
      <input
        type="datetime-local"
        value={settings.countdownTimer}
        onChange={(e) => setSettings({ ...settings, countdownTimer: e.target.value })}
        className="p-2 bg-gray-700 rounded w-full mb-2"
      />

      {/* Show Remaining Time */}
      {settings.countdownTimer && (
        <p className="text-gray-300 mt-2">
          <Clock className="inline mr-1" /> Countdown:{" "}
          <span className="font-bold">{calculateRemainingTime()}</span>
        </p>
      )}
    </>
  )}
</div>


{/* ✅ Analytics & Engagement Settings */}
<div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold mb-2 flex items-center">
    <Globe className="mr-2" /> Analytics & Engagement
  </h2>

  {/* Toggle Analytics Tracking */}
  <label className="block text-gray-400">
    <input
      type="checkbox"
      checked={settings.enableAnalytics}
      onChange={() =>
        setSettings({ ...settings, enableAnalytics: !settings.enableAnalytics })
      }
    />
    <span className="ml-2">Enable Analytics Tracking</span>
  </label>

  {/* Google Analytics Key Input */}
  {settings.enableAnalytics && (
    <>
      <label className="block text-gray-400 mt-4">Google Analytics Tracking ID</label>
      <input
        type="text"
        placeholder="UA-XXXXXXXXX-X"
        value={settings.googleAnalyticsKey}
        onChange={(e) =>
          setSettings({ ...settings, googleAnalyticsKey: e.target.value })
        }
        className="p-2 bg-gray-700 rounded w-full"
      />
    </>
  )}
</div>


{/* ✅ Live Streaming & Social Media Settings */}
<div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold mb-2 flex items-center">
    <Globe className="mr-2" /> Live Streaming & Social Media
  </h2>

  {/* Enable Live Streaming Toggle */}
  <label className="block text-gray-400">
    <input
      type="checkbox"
      checked={settings.enableLiveStreaming}
      onChange={() =>
        setSettings({ ...settings, enableLiveStreaming: !settings.enableLiveStreaming })
      }
    />
    <span className="ml-2">Enable Live Streaming</span>
  </label>

  {/* Streaming Service Configurations */}
  {settings.enableLiveStreaming && (
    <>
      {/* YouTube API Key */}
      <label className="block text-gray-400 mt-4">YouTube API Key</label>
      <input
        type="text"
        placeholder="Enter YouTube API Key"
        value={settings.youtubeApiKey}
        onChange={(e) =>
          setSettings({ ...settings, youtubeApiKey: e.target.value })
        }
        className="p-2 bg-gray-700 rounded w-full"
      />

      {/* Facebook Live API Key */}
      <label className="block text-gray-400 mt-4">Facebook Live API Key</label>
      <input
        type="text"
        placeholder="Enter Facebook API Key"
        value={settings.facebookApiKey}
        onChange={(e) =>
          setSettings({ ...settings, facebookApiKey: e.target.value })
        }
        className="p-2 bg-gray-700 rounded w-full"
      />

      {/* Custom Stream Link */}
      <label className="block text-gray-400 mt-4">Custom Stream Link</label>
      <input
        type="text"
        placeholder="Enter Custom Stream URL"
        value={settings.customStreamLink}
        onChange={(e) =>
          setSettings({ ...settings, customStreamLink: e.target.value })
        }
        className="p-2 bg-gray-700 rounded w-full"
      />
    </>
  )}
</div>





{/* ✅ Theme & Appearance */}
<div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold mb-2 flex items-center">
    <PaintBucket className="mr-2" /> Theme & Appearance
  </h2>
  

  {/* Theme Selection */}
  <label className="block text-gray-400 mb-1">Select Theme</label>
  <select
    value={settings.theme}
    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
    className="p-2 bg-gray-700 rounded w-full mb-3"
  >
    <option value="light">Light Mode</option>
    <option value="dark">Dark Mode</option>
  </select>

  {/* Primary Color Selection */}
  <label className="block text-gray-400 mb-1">Primary Color</label>
  <input
    type="color"
    value={settings.primaryColor}
    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
    className="p-2 bg-gray-700 rounded w-full mb-3"
  />

  {/* Font Selection */}
  <label className="block text-gray-400 mb-1">Font Style</label>
  <select
    value={settings.font}
    onChange={(e) => setSettings({ ...settings, font: e.target.value })}
    className="p-2 bg-gray-700 rounded w-full"
  >
    <option value="Inter">Inter</option>
    <option value="Roboto">Roboto</option>
    <option value="Poppins">Poppins</option>
    <option value="Lato">Lato</option>
    <option value="Montserrat">Montserrat</option>
  </select>
</div>

<button onClick={saveThemeSettings} className="mt-3 px-4 py-2 bg-green-600 rounded-lg text-white flex items-center">
  <Save className="mr-2" /> Save Theme
</button>

{/* ✅ Security Settings */}
<div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold mb-2 flex items-center">
    <Shield className="mr-2" /> Security Settings
  </h2>

  {/* Enable/Disable 2FA */}
  <label className="block text-gray-400 mb-2">
    <input
      type="checkbox"
      checked={settings.enable2FA}
      onChange={() => setSettings({ ...settings, enable2FA: !settings.enable2FA })}
    />
    <span className="ml-2">Enable Two-Factor Authentication (2FA)</span>
  </label>

  {/* Change Password */}
  <label className="block text-gray-400 mb-1">Change Password</label>
  <input
    type="password"
    placeholder="Enter New Password"
    value={settings.newPassword}
    onChange={(e) => setSettings({ ...settings, newPassword: e.target.value })}
    className="p-2 bg-gray-700 rounded w-full mb-3"
  />
  <button
    onClick={changePassword}
    className="px-4 py-2 bg-blue-500 rounded-lg text-white flex items-center"
  >
    <Lock className="mr-2" /> Update Password
  </button>

  {/* Login History */}
  <h3 className="text-md font-semibold mt-4">Login Activity</h3>
  <ul className="text-gray-300 mt-2">
    {settings.loginHistory.length > 0 ? (
      settings.loginHistory.map((entry, index) => (
        <li key={index} className="p-2 bg-gray-700 rounded mb-1">
          {entry.timestamp} - {entry.device} - {entry.location}
        </li>
      ))
    ) : (
      <p className="text-gray-400">No login history found.</p>
    )}
  </ul>
</div>

<button onClick={saveSecuritySettings} className="mt-3 px-4 py-2 bg-green-600 rounded-lg text-white flex items-center">
  <Save className="mr-2" /> Save Security
</button>


{/* ✅ Giving & Donations Settings */}
<div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold mb-2 flex items-center">
    <Gift className="mr-2" /> Giving & Donations
  </h2>

  {/* Toggle Online Giving */}
  <label className="block text-gray-400">
    <input
      type="checkbox"
      checked={settings.enableOnlineGiving}
      onChange={() =>
        setSettings({ ...settings, enableOnlineGiving: !settings.enableOnlineGiving })
      }
    />
    <span className="ml-2">Enable Online Giving</span>
  </label>

  {/* Select Payment Methods */}
  {settings.enableOnlineGiving && (
    <>
      <label className="block text-gray-400 mt-4">Accepted Payment Methods</label>
      <select
        multiple
        value={settings.paymentMethods}
        onChange={(e) =>
          setSettings({
            ...settings,
            paymentMethods: Array.from(e.target.selectedOptions, (option) => option.value),
          })
        }
        className="p-2 bg-gray-700 rounded w-full"
      >
        <option value="PayPal">PayPal</option>
        <option value="Stripe">Stripe</option>
        <option value="BankTransfer">Bank Transfer</option>
        <option value="CashApp">CashApp</option>
        <option value="Zelle">Zelle</option>
      </select>
    </>
  )}
</div>



{/* ✅ Homepage Banner Settings */}
<div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
  <h2 className="text-lg font-semibold mb-2">Homepage Banner</h2>

  {/* Banner Title */}
  <label className="block text-gray-400">Banner Title</label>
  <input
    type="text"
    placeholder="Enter banner title"
    value={settings.homepageBanner.title}
    onChange={(e) =>
      setSettings((prev) => ({
        ...prev,
        homepageBanner: { ...prev.homepageBanner, title: e.target.value },
      }))
    }
    className="p-2 bg-gray-700 rounded w-full mb-2"
  />

  {/* Banner Subtitle */}
  <label className="block text-gray-400">Banner Subtitle</label>
  <input
    type="text"
    placeholder="Enter banner subtitle"
    value={settings.homepageBanner.subtitle}
    onChange={(e) =>
      setSettings((prev) => ({
        ...prev,
        homepageBanner: { ...prev.homepageBanner, subtitle: e.target.value },
      }))
    }
    className="p-2 bg-gray-700 rounded w-full mb-2"
  />

  {/* Media Type Selection */}
  <label className="block text-gray-400">Media Type</label>
  <select
    value={settings.homepageBanner.mediaType}
    onChange={(e) =>
      setSettings((prev) => ({
        ...prev,
        homepageBanner: { ...prev.homepageBanner, mediaType: e.target.value },
      }))
    }
    className="p-2 bg-gray-700 rounded w-full mb-2"
  >
    <option value="image">Image</option>
    <option value="video">Video</option>
  </select>

  {/* Banner Preview */}
  <div className="mt-4">
    <h3 className="text-gray-400 mb-2">Banner Preview</h3>
    {settings.homepageBanner.mediaType === "video" ? (
      <video src={settings.homepageBanner.mediaUrl} controls className="w-full h-60 object-cover rounded" />
    ) : (
      <img src={settings.homepageBanner.mediaUrl} alt="Banner Preview" className="w-full h-60 object-cover rounded" />
    )}
  </div>

  {/* Upload New Banner */}
  <label className="block text-gray-400 mt-4">Upload Banner</label>
  <input type="file" accept="image/*,video/*" onChange={handleBannerUpload} className="p-2 bg-gray-700 rounded w-full" />

  {/* ✅ Upload Progress Bar */}
  {uploadProgress > 0 && (
    <div className="w-full bg-gray-600 mt-2 rounded">
      <div
        className="bg-green-500 text-xs text-white text-center p-1 rounded"
        style={{ width: `${uploadProgress}%` }}
      >
        {Math.round(uploadProgress)}%
      </div>
    </div>
  )}

  {/* Buttons */}
  <div className="flex justify-between mt-4">
    <button
      onClick={saveBannerSettings}
      className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center"
    >
      <Save className="mr-2" /> Save Banner
    </button>

    <button
      onClick={resetBannerToDefault}
      className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center"
    >
      Reset to Default
    </button>
  </div>
</div>






      {/* ✅ Notification Settings */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2 flex items-center">
          <Bell className="mr-2" /> Notification Settings
        </h2>
        <label className="block text-gray-400">
          <input type="checkbox" checked={settings.enableEmailNotifications} onChange={() => setSettings({ ...settings, enableEmailNotifications: !settings.enableEmailNotifications })} />
          <span className="ml-2">Enable Email Notifications</span>
        </label>
      </div>

      {/* ✅ Backup & Restore */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Backup & Restore</h2>
        <button onClick={exportSettings} className="px-4 py-2 bg-blue-500 rounded-lg text-white flex items-center">
          <Download className="mr-2" /> Export Settings
        </button>
        <input type="file" onChange={importSettings} className="p-2 bg-gray-700 rounded w-full mt-2" />
        <button onClick={resetSettings} className="mt-2 px-4 py-2 bg-red-500 rounded-lg text-white flex items-center">
          Reset to Default
        </button>
      </div>

      {/* ✅ Save Button */}
      <button onClick={saveSettings} className="mt-4 px-4 py-2 bg-green-600 rounded-lg text-white flex items-center">
        <Save className="mr-2" /> Save Changes
      </button>
    </div>
  );
}
