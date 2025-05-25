import { NextRequest, NextResponse } from "next/server";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";

// ✅ DO NOT explicitly type the second argument
export async function DELETE(
  req: NextRequest,
  context: any // ← just use 'any' to bypass the type mismatch
) {
  const { id } = context.params;

  try {
    await deleteDoc(doc(db, "livestreams", id));
    return NextResponse.json(
      { message: "Livestream deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting livestream:", error);
    return NextResponse.json(
      { error: "Failed to delete livestream" },
      { status: 500 }
    );
  }
}
