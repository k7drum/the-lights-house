import { NextResponse } from "next/server";
import { db, storage } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ✅ POST: Add a new livestream
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string;
    const status = formData.get("status") as string;
    const scheduleDate = formData.get("scheduleDate") as string;
    let videoURL = formData.get("videoURL") as string;

    // ✅ If a file is uploaded, save it to Firebase Storage
    if (type === "upload" && formData.has("videoFile")) {
      const file = formData.get("videoFile") as Blob;
      const storageRef = ref(storage, `livestreams/${title}-${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, file);
      videoURL = await getDownloadURL(snapshot.ref);
    }

    // ✅ Save livestream details to Firestore
    const livestreamRef = await addDoc(collection(db, "livestreams"), {
      title,
      description,
      videoURL,
      type,
      status,
      scheduleDate: status === "scheduled" ? scheduleDate : null,
      createdAt: new Date(),
    });

    return NextResponse.json({ id: livestreamRef.id, message: "Livestream created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating livestream:", error);
    return NextResponse.json({ message: "Error creating livestream" }, { status: 500 });
  }
}

// ✅ GET: Fetch all livestreams
export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, "livestreams"));
    const livestreams = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(livestreams, { status: 200 });
  } catch (error) {
    console.error("Error fetching livestreams:", error);
    return NextResponse.json({ message: "Error fetching livestreams" }, { status: 500 });
  }
}
