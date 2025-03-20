import { NextResponse } from "next/server";
import { auth, db } from "@/config/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save user data in Firestore with role
    await setDoc(doc(db, "users", user.uid), {
      email,
      role: role || "user", // Default role is "user"
      createdAt: new Date()
    });

    return NextResponse.json({ message: "User registered successfully", uid: user.uid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
