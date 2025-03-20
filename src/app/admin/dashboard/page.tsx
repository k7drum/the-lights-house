"use client";
import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Users, MessageCircle, FileText, Video, Calendar, Heart } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    members: 0,
    messages: 0,
    blogs: 0,
    livestreams: 0,
    events: 0,
    prayers: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const membersSnapshot = await getDocs(collection(db, "members"));
      const messagesSnapshot = await getDocs(collection(db, "messages"));
      const blogsSnapshot = await getDocs(collection(db, "blogs"));
      const livestreamsSnapshot = await getDocs(collection(db, "livestreams"));
      const eventsSnapshot = await getDocs(collection(db, "events"));
      const prayersSnapshot = await getDocs(collection(db, "prayer-wall"));

      setStats({
        members: membersSnapshot.size,
        messages: messagesSnapshot.size,
        blogs: blogsSnapshot.size,
        livestreams: livestreamsSnapshot.size,
        events: eventsSnapshot.size,
        prayers: prayersSnapshot.size,
      });
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <StatCard icon={<Users />} label="Members" count={stats.members} />
        <StatCard icon={<MessageCircle />} label="Messages" count={stats.messages} />
        <StatCard icon={<FileText />} label="Blogs" count={stats.blogs} />
        <StatCard icon={<Video />} label="Livestreams" count={stats.livestreams} />
        <StatCard icon={<Calendar />} label="Events" count={stats.events} />
        <StatCard icon={<Heart />} label="Prayer Requests" count={stats.prayers} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, count }) {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg flex items-center shadow-md">
      <div className="text-red-500 text-3xl mr-4">{icon}</div>
      <div>
        <h2 className="text-xl font-semibold">{count}</h2>
        <p className="text-gray-400">{label}</p>
      </div>
    </div>
  );
}
