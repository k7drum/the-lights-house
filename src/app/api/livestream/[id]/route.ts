import { NextResponse } from "next/server";
import { db } from "@/config/firebaseConfig";
import { doc, deleteDoc } from "firebase/firestore";

// ✅ DELETE: Delete a livestream by ID
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await deleteDoc(doc(db, "livestreams", params.id));
    return NextResponse.json({ message: "Livestream deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting livestream:", error);
    return NextResponse.json({ message: "Error deleting livestream" }, { status: 500 });
  }
}
