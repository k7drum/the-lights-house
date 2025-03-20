import { NextResponse } from "next/server";
import { auth } from "@/config/firebaseConfig";
import { signOut } from "firebase/auth";

export async function POST() {
  try {
    await signOut(auth);
    return NextResponse.json({ message: "User logged out successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
