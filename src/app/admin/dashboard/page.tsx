"use client";
import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Line, Pie } from "react-chartjs-2";
import { Users, MessageCircle, FileText, Video, Calendar, Heart } from "lucide-react";
import "chart.js/auto";
import withRoleProtection from "@/components/auth/withRoleProtection";
dayjs.extend(relativeTime);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    members: 0,
    messages: 0,
    blogs: 0,
    livestreams: 0,
    events: 0,
    prayers: 0,
  });
  
  const [usersByMonth, setUsersByMonth] = useState({ currentMonth: [], pastMonth: [] });
  const [usersByDevice, setUsersByDevice] = useState({ desktop: 0, tablet: 0, mobile: 0 });
  // other states...
  
  // ... your existing API calls for stats, banner, sermons, livestream, etc.

  // NEW: Fetch chart data from Firestore
  useEffect(() => {
    const fetchChartData = async () => {
      try { 
        const docRef = doc(db, "userStats", "stats"); // Adjust this to your Firestore schema
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsersByMonth({
            currentMonth: data.currentMonth,
            pastMonth: data.pastMonth,
          });
          setUsersByDevice({
            desktop: data.desktop,
            tablet: data.tablet,
            mobile: data.mobile,
          });
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
      }
    };

    fetchChartData();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const membersSnapshot = await getDocs(collection(db, "users"));
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
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };
  
    fetchStats();
  }, []);
  
  
  return (
    <div className="bg-black text-white min-h-screen">
      {/* ... Hero Section, Live Stream Section, etc. ... */}

      <div className="p-6">
  <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
    <StatCard icon={<Users />} label="Members" count={stats.members} />
    <StatCard icon={<MessageCircle />} label="Messages" count={stats.messages} />
    <StatCard icon={<FileText />} label="Blogs" count={stats.blogs} />
    <StatCard icon={<Video />} label="Livestreams" count={stats.livestreams} />
    <StatCard icon={<Calendar />} label="Events" count={stats.events} />
    <StatCard icon={<Heart />} label="Prayer Requests" count={stats.prayers} />
  </div>
</div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
  {/* Line Chart */}
  <motion.div
    className="bg-gray-900 text-white p-4 rounded-lg shadow-md"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7 }}
  >
    <h2 className="text-lg font-semibold mb-2">Users</h2>
    <p className="text-gray-400 text-sm mb-4">Current Month vs. Past Month</p>
    <div className="h-64"> {/* ✅ Set fixed height here */}
      <Line
        data={{
          labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", "Day 8", "Day 9"],
          datasets: [
            {
              label: "Current Month",
              data: usersByMonth.currentMonth,
              borderColor: "#4ADE80",
              backgroundColor: "rgba(74, 222, 128, 0.2)",
              fill: true,
              tension: 0.3,
            },
            {
              label: "Past Month",
              data: usersByMonth.pastMonth,
              borderColor: "#F87171",
              backgroundColor: "rgba(248, 113, 113, 0.2)",
              fill: true,
              tension: 0.3,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              grid: { color: "#374151" },
              ticks: { color: "#9CA3AF" },
            },
            x: {
              grid: { color: "#374151" },
              ticks: { color: "#9CA3AF" },
            },
          },
          plugins: {
            legend: { labels: { color: "#9CA3AF" } },
          },
        }}
      />
    </div>
  </motion.div>

  {/* Pie Chart */}
  <motion.div
    className="bg-gray-900 text-white p-4 rounded-lg shadow-md"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.7, delay: 0.2 }}
  >
    <h2 className="text-lg font-semibold mb-2">Users by Device</h2>
    <p className="text-gray-400 text-sm mb-4">Desktop, Tablet, Mobile</p>
    <div className="h-64 flex items-center justify-center"> {/* ✅ Smaller height */}
      <Pie
        data={{
          labels: ["Desktop", "Tablet", "Mobile"],
          datasets: [
            {
              data: [
                usersByDevice.desktop,
                usersByDevice.tablet,
                usersByDevice.mobile,
              ],
              backgroundColor: ["#3B82F6", "#FBBF24", "#10B981"],
              hoverBackgroundColor: ["#2563EB", "#F59E0B", "#059669"],
              borderColor: "#1F2937",
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: "#9CA3AF" },
            },
          },
        }}
      />
    </div>
  </motion.div>
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

