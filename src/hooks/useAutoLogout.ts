"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebaseConfig";
import { useRouter } from "next/navigation";

const IDLE_LIMIT = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME = 1 * 60 * 1000; // Show warning at 14 minutes

export function useAutoLogout() {
  const [showWarning, setShowWarning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const resetTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setShowWarning(false);
    startTimers();
  };

  const startTimers = () => {
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
    }, IDLE_LIMIT - WARNING_TIME);

    timeoutRef.current = setTimeout(() => {
      signOut(auth);
      router.push("/auth/login");
    }, IDLE_LIMIT);
  };

  useEffect(() => {
    const activityEvents = ["mousemove", "keydown", "click"];
    activityEvents.forEach((event) => window.addEventListener(event, resetTimers));

    startTimers();

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimers));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, []);

  return { showWarning, setShowWarning };
}
