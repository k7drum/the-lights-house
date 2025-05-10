import { NextResponse } from "next/server";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    // Basic validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await addDoc(collection(db, "contactRequests"), {
      name,
      email,
      subject,
      message,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
