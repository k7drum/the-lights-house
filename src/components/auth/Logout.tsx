"use client";
import { auth } from "@/config/firebaseConfig";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <button onClick={handleLogout} className="bg-red-600 text-white py-2 px-4 rounded">
      Logout
    </button>
  );
}
