// src/app/pages/[slug]/page.tsx
import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";
import { db } from "@/config/firebaseConfig";

type PageData = {
  css?: string;
  html?: string;
};

export default async function Page({
  params,
}: {
  // Next.js expects params to be a Promise here:
  params: Promise<{ slug: string }>;
}) {
  // first await the incoming params
  const { slug } = await params;

  // fetch from Firestore
  const pageRef = doc(db, "pages", slug);
  const pageSnap = await getDoc(pageRef);
  if (!pageSnap.exists()) {
    notFound();
  }

  const { css, html } = pageSnap.data() as PageData;

  return (
    <div>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <div dangerouslySetInnerHTML={{ __html: html ?? "" }} />
    </div>
  );
}
