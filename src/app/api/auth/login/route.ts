import { NextResponse } from "next/server";
import { auth } from "@/config/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return NextResponse.json({ message: "User logged in", uid: user.uid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
