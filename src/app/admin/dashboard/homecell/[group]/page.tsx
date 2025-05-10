"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";

export default function GroupMembersPage() {
  const params = useParams();
  const groupName = decodeURIComponent(params.group as string);

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const filtered = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => user.homecell === groupName);

        setMembers(filtered);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupName]);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">
        Members in Homecell Group: <span className="text-yellow-400">{groupName}</span>
      </h1>

      <Link href="/admin/dashboard/homecell">
        <button className="mb-4 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
          ← Back to Homecell Dashboard
        </button>
      </Link>

      {loading ? (
        <p>Loading members...</p>
      ) : members.length === 0 ? (
        <p>No members found in this group.</p>
      ) : (
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="p-2">{member.name || "Unnamed"}</td>
                  <td className="p-2">{member.email || "N/A"}</td>
                  <td className="p-2">{member.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
