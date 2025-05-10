"use client";
import { ReactNode } from "react";

export default function Modal({
  children,
  title,
  onClose,
}: {
  children: ReactNode;
  title?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg p-6 max-w-md w-full relative">
        <h2 className="text-xl font-bold mb-4">{title || "Notice"}</h2>
        {children}
        <button
          className="mt-4 px-4 py-2 bg-yellow-500 rounded hover:bg-yellow-600"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
