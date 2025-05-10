// src/components/Footer.tsx
"use client";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 text-center">
      <p>© {new Date().getFullYear()} The Light's House. All rights reserved.</p>
      <div className="flex justify-center gap-4 mt-4">
        <Link href="#">Facebook</Link>
        <Link href="#">YouTube</Link>
        <Link href="#">Instagram</Link>
      </div>
    </footer>
  );
}
