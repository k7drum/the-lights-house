"use client";
import { useState, useEffect } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Bar, Line, Pie } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function AnalyticsDashboard() {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [givingData, setGivingData] = useState<any[]>([]);
  const [memberGrowthData, setMemberGrowthData] = useState<any[]>([]);
  const [homecellData, setHomecellData] = useState<any[]>([]);
  const [blogEngagementData, setBlogEngagementData] = useState<any[]>([]);
  const [selectedChart, setSelectedChart] = useState("attendance");

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const attendanceSnapshot = await getDocs(collection(db, "attendance"));
      setAttendanceData(attendanceSnapshot.docs.map((doc) => doc.data()));

      const givingSnapshot = await getDocs(collection(db, "donations"));
      setGivingData(givingSnapshot.docs.map((doc) => doc.data()));

      const membersSnapshot = await getDocs(collection(db, "members"));
      setMemberGrowthData(membersSnapshot.docs.map((doc) => doc.data()));

      const homecellSnapshot = await getDocs(collection(db, "homecells"));
      setHomecellData(homecellSnapshot.docs.map((doc) => doc.data()));

      const blogsSnapshot = await getDocs(collection(db, "blogs"));
      setBlogEngagementData(blogsSnapshot.docs.map((doc) => doc.data()));
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    }
  };

  const exportToExcel = () => {
    let dataToExport;
    switch (selectedChart) {
      case "attendance":
        dataToExport = attendanceData;
        break;
      case "giving":
        dataToExport = givingData;
        break;
      case "members":
        dataToExport = memberGrowthData;
        break;
      case "homecells":
        dataToExport = homecellData;
        break;
      case "blogs":
        dataToExport = blogEngagementData;
        break;
      default:
        dataToExport = [];
    }
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Export");
    XLSX.writeFile(workbook, "analytics_export.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Analytics Export", 20, 10);
    let dataToExport;
    switch (selectedChart) {
      case "attendance":
        dataToExport = attendanceData;
        break;
      case "giving":
        dataToExport = givingData;
        break;
      case "members":
        dataToExport = memberGrowthData;
        break;
      case "homecells":
        dataToExport = homecellData;
        break;
      case "blogs":
        dataToExport = blogEngagementData;
        break;
      default:
        dataToExport = [];
    }
    doc.autoTable({
      head: Object.keys(dataToExport[0] || {}).map((key) => [key]),
      body: dataToExport.map((row) => Object.values(row)),
    });
    doc.save("analytics_export.pdf");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Analytics & Charts</h1>
      <div className="mt-4 flex space-x-4">
        <select
          value={selectedChart}
          onChange={(e) => setSelectedChart(e.target.value)}
          className="p-2 bg-gray-700 rounded"
        >
          <option value="attendance">Attendance Trends</option>
          <option value="giving">Giving Trends</option>
          <option value="members">Member Growth</option>
          <option value="homecells">Homecell Performance</option>
          <option value="blogs">Blog Engagement</option>
        </select>
        <button onClick={exportToExcel} className="px-4 py-2 bg-blue-500 rounded-lg text-white flex items-center">
          <Download className="mr-2" /> Export to Excel
        </button>
        <button onClick={exportToPDF} className="px-4 py-2 bg-green-500 rounded-lg text-white flex items-center">
          <Download className="mr-2" /> Export to PDF
        </button>
      </div>
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        {selectedChart === "attendance" && <Bar data={{ labels: attendanceData.map((d) => d.date), datasets: [{ label: "Attendance", data: attendanceData.map((d) => d.totalAttendees), backgroundColor: "#ff6384" }] }} />}
        {selectedChart === "giving" && <Line data={{ labels: givingData.map((d) => d.date), datasets: [{ label: "Total Donations", data: givingData.map((d) => d.amount), backgroundColor: "#36a2eb" }] }} />}
        {selectedChart === "members" && <Line data={{ labels: memberGrowthData.map((d) => d.date), datasets: [{ label: "New Members", data: memberGrowthData.map((d) => d.count), backgroundColor: "#4bc0c0" }] }} />}
        {selectedChart === "homecells" && <Bar data={{ labels: homecellData.map((d) => d.name), datasets: [{ label: "Members Count", data: homecellData.map((d) => d.membersCount), backgroundColor: "#9966ff" }] }} />}
        {selectedChart === "blogs" && <Pie data={{ labels: blogEngagementData.map((d) => d.title), datasets: [{ label: "Engagement", data: blogEngagementData.map((d) => d.views), backgroundColor: ["#ffcd56", "#ff6384", "#36a2eb"] }] }} />}
      </div>
    </div>
  );
}
