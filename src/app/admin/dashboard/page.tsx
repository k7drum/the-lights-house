// src/app/admin/dashboard/page.tsx
"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Line, Pie, Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { Download, Users, MessageCircle, FileText, Video, Calendar, Heart } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import withRoleProtection from "@/components/auth/withRoleProtection";

Chart.register(...registerables);
dayjs.extend(relativeTime);

interface StatCardProps {
  icon: ReactNode;
  label: string;
  count: number;
}
function StatCard({ icon, label, count }: StatCardProps) {
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

function DashboardPage() {
  // ─── Stats ─────────────────────────────────────────
  const [stats, setStats] = useState({
    members: 0,
    messages: 0,
    blogs: 0,
    livestreams: 0,
    events: 0,
    prayers: 0,
  });
  useEffect(() => {
    (async () => {
      try {
        const [
          membersSnap,
          messagesSnap,
          blogsSnap,
          livestreamsSnap,
          eventsSnap,
          prayersSnap,
        ] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "messages")),
          getDocs(collection(db, "blogs")),
          getDocs(collection(db, "livestreams")),
          getDocs(collection(db, "events")),
          getDocs(collection(db, "prayer-wall")),
        ]);
        setStats({
          members: membersSnap.size,
          messages: messagesSnap.size,
          blogs: blogsSnap.size,
          livestreams: livestreamsSnap.size,
          events: eventsSnap.size,
          prayers: prayersSnap.size,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    })();
  }, []);

  // ─── Chart Data ─────────────────────────────────────
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [givingData, setGivingData] = useState<any[]>([]);
  const [memberGrowthData, setMemberGrowthData] = useState<any[]>([]);
  const [homecellData, setHomecellData] = useState<any[]>([]);
  const [blogEngagementData, setBlogEngagementData] = useState<any[]>([]);
  const [usersByMonth, setUsersByMonth] = useState<{ currentMonth: number[]; pastMonth: number[] }>({
    currentMonth: [],
    pastMonth: [],
  });
  const [usersByDevice, setUsersByDevice] = useState<{ desktop: number; tablet: number; mobile: number }>({
    desktop: 0,
    tablet: 0,
    mobile: 0,
  });
  const [selectedChart, setSelectedChart] = useState<"attendance"|"giving"|"members"|"homecells"|"blogs">("attendance");

  useEffect(() => {
    (async () => {
      try {
        // fetch collections
        const [attSnap, giveSnap, memSnap, homeSnap, blogSnap, userStatsSnap] = await Promise.all([
          getDocs(collection(db, "attendance")),
          getDocs(collection(db, "donations")),
          getDocs(collection(db, "members")),
          getDocs(collection(db, "homecells")),
          getDocs(collection(db, "blogs")),
          getDoc(doc(db, "userStats", "stats")),
        ]);
        setAttendanceData(attSnap.docs.map((d) => d.data()));
        setGivingData(giveSnap.docs.map((d) => d.data()));
        setMemberGrowthData(memSnap.docs.map((d) => d.data()));
        setHomecellData(homeSnap.docs.map((d) => d.data()));
        setBlogEngagementData(blogSnap.docs.map((d) => d.data()));

        // user stats doc
        if (userStatsSnap.exists()) {
          const d = userStatsSnap.data();
          setUsersByMonth({ currentMonth: d.currentMonth, pastMonth: d.pastMonth });
          setUsersByDevice({ desktop: d.desktop, tablet: d.tablet, mobile: d.mobile });
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      }
    })();
  }, []);

  // ─── Export Helpers ───────────────────────────────────
  const exportJson = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export");
    XLSX.writeFile(wb, filename + ".xlsx");
  };
  const exportPdf = (data: any[], title: string) => {
    const doc = new jsPDF();
    doc.text(title, 20, 10);
    doc.autoTable({
      head: [Object.keys(data[0] || {})],
      body: data.map((r) => Object.values(r)),
    });
    doc.save(title + ".pdf");
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* ─ Stats Row ─ */}
      <div className="p-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <StatCard icon={<Users />} label="Members" count={stats.members} />
          <StatCard icon={<MessageCircle />} label="Messages" count={stats.messages} />
          <StatCard icon={<FileText />} label="Blogs" count={stats.blogs} />
          <StatCard icon={<Video />} label="Livestreams" count={stats.livestreams} />
          <StatCard icon={<Calendar />} label="Events" count={stats.events} />
          <StatCard icon={<Heart />} label="Prayers" count={stats.prayers} />
        </div>
      </div>

      {/* ─ Chart Selection + Exports ─ */}
      <div className="p-6 flex flex-wrap items-center gap-4">
        <select
          value={selectedChart}
          onChange={(e) => setSelectedChart(e.target.value as any)}
          className="p-2 bg-gray-700 rounded"
        >
          <option value="attendance">Attendance Trends</option>
          <option value="giving">Giving Trends</option>
          <option value="members">Member Growth</option>
          <option value="homecells">Homecell Performance</option>
          <option value="blogs">Blog Engagement</option>
        </select>
        <button
          onClick={() =>
            exportJson(
              selectedChart === "attendance"
                ? attendanceData
                : selectedChart === "giving"
                ? givingData
                : selectedChart === "members"
                ? memberGrowthData
                : selectedChart === "homecells"
                ? homecellData
                : blogEngagementData,
              selectedChart
            )
          }
          className="flex items-center px-4 py-2 bg-blue-500 rounded-lg"
        >
          <Download className="mr-2" /> Excel
        </button>
        <button
          onClick={() =>
            exportPdf(
              selectedChart === "attendance"
                ? attendanceData
                : selectedChart === "giving"
                ? givingData
                : selectedChart === "members"
                ? memberGrowthData
                : selectedChart === "homecells"
                ? homecellData
                : blogEngagementData,
              selectedChart
            )
          }
          className="flex items-center px-4 py-2 bg-green-500 rounded-lg"
        >
          <Download className="mr-2" /> PDF
        </button>
      </div>

      {/* ─ Chart Canvas ─ */}
      <div className="p-6 bg-gray-800 rounded-lg">
        {selectedChart === "attendance" && (
          <Bar
            data={{
              labels: attendanceData.map((d) => d.date),
              datasets: [{ label: "Attendance", data: attendanceData.map((d) => d.totalAttendees), backgroundColor: "#ff6384" }],
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        )}
        {selectedChart === "giving" && (
          <Line
            data={{
              labels: givingData.map((d) => d.date),
              datasets: [{ label: "Donations", data: givingData.map((d) => d.amount), backgroundColor: "#36a2eb" }],
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        )}
        {selectedChart === "members" && (
          <Line
            data={{
              labels: memberGrowthData.map((d) => d.date),
              datasets: [{ label: "New Members", data: memberGrowthData.map((d) => d.count), backgroundColor: "#4bc0c0" }],
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        )}
        {selectedChart === "homecells" && (
          <Bar
            data={{
              labels: homecellData.map((d) => d.name),
              datasets: [{ label: "Members Count", data: homecellData.map((d) => d.membersCount), backgroundColor: "#9966ff" }],
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        )}
        {selectedChart === "blogs" && (
          <Pie
            data={{
              labels: blogEngagementData.map((d) => d.title),
              datasets: [{ label: "Engagement", data: blogEngagementData.map((d) => d.views), backgroundColor: ["#ffcd56", "#ff6384", "#36a2eb"] }],
            }}
            options={{ responsive: true, maintainAspectRatio: false }}
          />
        )}
      </div>
    </div>
  );
}

// explicitly allow only admins
export default withRoleProtection(DashboardPage, ["admin"]);
