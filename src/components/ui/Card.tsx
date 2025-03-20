import React from "react";

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-gray-800 p-6 rounded-lg shadow-md text-center">{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xl font-semibold">{children}</h3>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-300">{children}</p>;
}
