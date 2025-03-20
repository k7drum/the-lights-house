"use client";
import { useState, useEffect } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { Trash2, Edit, Plus, Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function GivingManagement() {
  const [donations, setDonations] = useState<any[]>([]);
  const [newDonation, setNewDonation] = useState({
    donorName: "",
    email: "",
    amount: "",
    date: "",
    method: "",
    type: "",
  });

  useEffect(() => {
    fetchDonations();
  }, []);

  // ✅ Fetch Donations
  const fetchDonations = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "donations"));
      const donationList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDonations(donationList);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  };

  // ✅ Save Donation
  const saveDonation = async () => {
    if (!newDonation.donorName || !newDonation.amount || !newDonation.date || !newDonation.method || !newDonation.type) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      await addDoc(collection(db, "donations"), newDonation);
      setNewDonation({ donorName: "", email: "", amount: "", date: "", method: "", type: "" });
      fetchDonations();
      alert("Donation Recorded Successfully!");
    } catch (error) {
      console.error("Error saving donation:", error);
      alert("Failed to save donation.");
    }
  };

  // ✅ Export Donations to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(donations);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Donations");
    XLSX.writeFile(workbook, "donation_records.xlsx");
  };

  // ✅ Export Donations to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Donation Records", 20, 10);
    doc.autoTable({
      head: [["Donor Name", "Email", "Amount", "Date", "Method", "Type"]],
      body: donations.map((donation) => [
        donation.donorName,
        donation.email || "N/A",
        donation.amount,
        donation.date,
        donation.method,
        donation.type,
      ]),
    });
    doc.save("donation_records.pdf");
  };

  // ✅ Donation Chart Data
  const chartData = {
    labels: donations.map((donation) => donation.date),
    datasets: [
      {
        label: "Donation Amount",
        data: donations.map((donation) => donation.amount),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Giving Management</h1>

      {/* Add Donation Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Record a Donation</h2>
        <input
          type="text"
          placeholder="Donor Name"
          value={newDonation.donorName}
          onChange={(e) => setNewDonation({ ...newDonation, donorName: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />
        <input
          type="email"
          placeholder="Email (Optional)"
          value={newDonation.email}
          onChange={(e) => setNewDonation({ ...newDonation, email: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />
        <input
          type="number"
          placeholder="Amount"
          value={newDonation.amount}
          onChange={(e) => setNewDonation({ ...newDonation, amount: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />
        <input
          type="date"
          value={newDonation.date}
          onChange={(e) => setNewDonation({ ...newDonation, date: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />
        <select
          value={newDonation.type}
          onChange={(e) => setNewDonation({ ...newDonation, type: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        >
          <option value="">Select Type of Giving</option>
          <option value="Tithe">Tithe</option>
          <option value="Offering">Offering</option>
          <option value="Special Donation">Special Donation</option>
          <option value="Others">Others</option>
          <option value="Charity">Charity</option>
        </select>
        <input
          type="text"
          placeholder="Payment Method"
          value={newDonation.method}
          onChange={(e) => setNewDonation({ ...newDonation, method: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />
        <button onClick={saveDonation} className="px-4 py-2 bg-red-600 rounded-lg text-white flex items-center">
          <Plus className="mr-2" /> Save Donation
        </button>
      </div>

      {/* Donation History */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Donation History</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Donor Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Date</th>
              <th className="p-2">Method</th>
              <th className="p-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {donations.map((donation) => (
              <tr key={donation.id}>
                <td className="p-2">{donation.donorName}</td>
                <td className="p-2">{donation.email || "N/A"}</td>
                <td className="p-2">${donation.amount}</td>
                <td className="p-2">{donation.date}</td>
                <td className="p-2">{donation.method}</td>
                <td className="p-2">{donation.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Options */}
      <div className="mt-4 flex space-x-2">
        <button onClick={exportToExcel} className="px-4 py-2 bg-blue-500 rounded-lg text-white flex items-center">
          <Download className="mr-2" /> Export to Excel
        </button>
        <button onClick={exportToPDF} className="px-4 py-2 bg-green-500 rounded-lg text-white flex items-center">
          <Download className="mr-2" /> Export to PDF
        </button>
      </div>

      {/* Chart Display */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Donation Trends</h2>
        <Bar data={chartData} />
      </div>
    </div>
  );
}
