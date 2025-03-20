"use client";
import { useState, useEffect } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { Plus, Download, Trash2, Edit } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ServiceAttendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [newAttendance, setNewAttendance] = useState({
    date: "",
    serviceType: "",
    maleCount: 0,
    femaleCount: 0,
    childrenCount: 0,
    newcomers: 0,
    totalAttendees: 0,
  });

  useEffect(() => {
    fetchAttendanceRecords();
  }, []);

  // ✅ Fetch Attendance Records
  const fetchAttendanceRecords = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "attendance"));
      const records = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
    }
  };

  // ✅ Save or Update Attendance Record
  const saveAttendance = async () => {
    if (!newAttendance.date || !newAttendance.serviceType) {
      alert("Please select date and service type!");
      return;
    }

    const totalAttendees =
      Number(newAttendance.maleCount) +
      Number(newAttendance.femaleCount) +
      Number(newAttendance.childrenCount) +
      Number(newAttendance.newcomers);

    try {
      if (editingRecord) {
        // Update existing record
        await updateDoc(doc(db, "attendance", editingRecord.id), { ...newAttendance, totalAttendees });
      } else {
        // Add new record
        await addDoc(collection(db, "attendance"), { ...newAttendance, totalAttendees });
      }

      setNewAttendance({
        date: "",
        serviceType: "",
        maleCount: 0,
        femaleCount: 0,
        childrenCount: 0,
        newcomers: 0,
        totalAttendees: 0,
      });
      setEditingRecord(null);
      fetchAttendanceRecords();
      alert(editingRecord ? "Attendance Updated Successfully!" : "Attendance Recorded Successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  // ✅ Edit Attendance Record
  const editAttendance = (record: any) => {
    setEditingRecord(record);
    setNewAttendance({
      date: record.date,
      serviceType: record.serviceType,
      maleCount: record.maleCount,
      femaleCount: record.femaleCount,
      childrenCount: record.childrenCount,
      newcomers: record.newcomers,
      totalAttendees: record.totalAttendees,
    });
  };

  // ✅ Delete Attendance Record
  const deleteAttendance = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteDoc(doc(db, "attendance", id));
      fetchAttendanceRecords();
      alert("Attendance Record Deleted Successfully!");
    } catch (error) {
      console.error("Error deleting attendance record:", error);
    }
  };

  // ✅ Export Attendance Data to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(attendanceRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, "attendance_records.xlsx");
  };

  // ✅ Export Attendance Data to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Service Attendance Records", 20, 10);
    doc.autoTable({
      head: [["Date", "Service Type", "Male", "Female", "Children", "Newcomers", "Total Attendees"]],
      body: attendanceRecords.map((record) => [
        record.date,
        record.serviceType,
        record.maleCount,
        record.femaleCount,
        record.childrenCount,
        record.newcomers,
        record.totalAttendees,
      ]),
    });
    doc.save("attendance_records.pdf");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Service Attendance</h1>

      {/* Add Attendance Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">{editingRecord ? "Edit Attendance" : "Record Attendance"}</h2>

        <label className="text-sm">Date:</label>
        <input
          type="date"
          value={newAttendance.date}
          onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />

        <label className="text-sm">Service Type:</label>
        <select
          value={newAttendance.serviceType}
          onChange={(e) => setNewAttendance({ ...newAttendance, serviceType: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        >
          <option value="">Select Service Type</option>
          <option value="Sunday Service">Sunday Service</option>
          <option value="Midweek Service">Midweek Service</option>
          <option value="Special Event">Special Event</option>
        </select>

        <label className="text-sm">Number of Males:</label>
        <input
          type="number"
          min="0"
          value={newAttendance.maleCount}
          onChange={(e) => setNewAttendance({ ...newAttendance, maleCount: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />

        <label className="text-sm">Number of Females:</label>
        <input
          type="number"
          min="0"
          value={newAttendance.femaleCount}
          onChange={(e) => setNewAttendance({ ...newAttendance, femaleCount: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />

        <label className="text-sm">Number of Children:</label>
        <input
          type="number"
          min="0"
          value={newAttendance.childrenCount}
          onChange={(e) => setNewAttendance({ ...newAttendance, childrenCount: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />

        <label className="text-sm">Newcomers:</label>
        <input
          type="number"
          min="0"
          value={newAttendance.newcomers}
          onChange={(e) => setNewAttendance({ ...newAttendance, newcomers: e.target.value })}
          className="p-2 bg-gray-700 rounded w-full mb-2"
        />

        <button onClick={saveAttendance} className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center">
          <Plus className="mr-2" /> {editingRecord ? "Update Attendance" : "Save Attendance"}
        </button>
      </div>

      {/* Attendance History */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Attendance History</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Date</th>
              <th className="p-2">Service Type</th>
              <th className="p-2">Total Attendees</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRecords.map((record) => (
              <tr key={record.id}>
                <td className="p-2">{record.date}</td>
                <td className="p-2">{record.serviceType}</td>
                <td className="p-2">{record.totalAttendees}</td>
                <td className="p-2 flex space-x-2">
                  <button onClick={() => editAttendance(record)} className="text-blue-400">
                    <Edit />
                  </button>
                  <button onClick={() => deleteAttendance(record.id)} className="text-red-500">
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
