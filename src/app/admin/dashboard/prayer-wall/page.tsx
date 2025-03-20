"use client";
import { useState, useEffect } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Trash2, CheckCircle, FileText, Download } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function PrayerWallPage() {
  const [prayers, setPrayers] = useState<any[]>([]);
  const [newPrayer, setNewPrayer] = useState({
    name: "",
    request: "",
    prayedFor: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrayers();
  }, []);

  // ✅ Fetch Prayers from Firestore
  const fetchPrayers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "prayers"));
      const prayerList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPrayers(prayerList);
    } catch (error) {
      console.error("Error fetching prayers:", error);
    }
  };

  // ✅ Submit Prayer Request
  const savePrayer = async () => {
    if (!newPrayer.name || !newPrayer.request) {
      alert("Please fill all fields!");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, "prayers"), {
        name: newPrayer.name,
        request: newPrayer.request,
        prayedFor: false,
        createdAt: new Date(),
      });

      setNewPrayer({ name: "", request: "", prayedFor: false });
      fetchPrayers();
      alert("Prayer Request Submitted!");
    } catch (error) {
      console.error("Error submitting prayer request:", error);
      alert("Failed to submit prayer request.");
    }
    setSaving(false);
  };

  // ✅ Toggle Prayed For Status
  const togglePrayedFor = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "prayers", id), {
        prayedFor: !currentStatus,
      });
      fetchPrayers();
    } catch (error) {
      console.error("Error updating prayer status:", error);
    }
  };

  // ✅ Delete Prayer Request
  const deletePrayer = async (id: string) => {
    try {
      await deleteDoc(doc(db, "prayers", id));
      fetchPrayers();
    } catch (error) {
      console.error("Error deleting prayer request:", error);
    }
  };

  // ✅ Export to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(prayers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prayers");
    XLSX.writeFile(workbook, "prayers_list.xlsx");
  };

  // ✅ Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Prayer Requests", 20, 10);
    doc.autoTable({
      head: [["Name", "Request", "Prayed For"]],
      body: prayers.map((prayer) => [
        prayer.name,
        prayer.request,
        prayer.prayedFor ? "Yes" : "No",
      ]),
    });
    doc.save("prayers_list.pdf");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Prayer Wall</h1>

      {/* Submit Prayer Request Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Submit a Prayer Request</h2>
        <input
          type="text"
          placeholder="Your Name"
          value={newPrayer.name}
          onChange={(e) => setNewPrayer({ ...newPrayer, name: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />
        <textarea
          placeholder="Your Prayer Request"
          value={newPrayer.request}
          onChange={(e) => setNewPrayer({ ...newPrayer, request: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        ></textarea>
        <button onClick={savePrayer} disabled={saving} className="mt-2 px-4 py-2 bg-red-600 rounded-lg text-white">
          {saving ? "Submitting..." : "Submit Prayer Request"}
        </button>
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

      {/* Prayer Requests List */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Prayer Requests</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Request</th>
              <th className="p-2">Prayed For</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prayers.map((prayer) => (
              <tr key={prayer.id}>
                <td className="p-2">{prayer.name}</td>
                <td className="p-2">{prayer.request}</td>
                <td className="p-2">
                  <button onClick={() => togglePrayedFor(prayer.id, prayer.prayedFor)} className="text-yellow-400">
                    <CheckCircle className={prayer.prayedFor ? "text-green-500" : "text-gray-500"} />
                  </button>
                </td>
                <td className="p-2 flex space-x-2">
                  <button onClick={() => deletePrayer(prayer.id)} className="text-red-500">
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
