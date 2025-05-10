"use client";
import Link from "next/link";

export default function GivingSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center px-4">
      <h1 className="text-4xl font-bold mb-4 text-yellow-400">Thank You!</h1>
      <p className="text-lg mb-6">Your donation has been received successfully. God bless you!</p>
      <Link href="/">
        <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-lg">
          Back to Home
        </button>
      </Link>
    </div>
  );
}
