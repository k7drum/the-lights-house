import { db } from "@/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";

export default async function Page({ params }) {
  const { slug } = params;

  // ✅ Fetch Page Data
  const pageRef = doc(db, "pages", slug);
  const pageSnap = await getDoc(pageRef);

  if (!pageSnap.exists()) {
    return notFound();
  }

  const pageData = pageSnap.data();

  return (
    <div>
      <style>{pageData.css}</style>
      <div dangerouslySetInnerHTML={{ __html: pageData.html }} />
    </div>
  );
}
