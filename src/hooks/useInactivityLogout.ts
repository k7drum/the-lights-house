"use client";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/config/firebaseConfig";

export default function useInactivityLogout(timeoutMinutes = 15) {
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        alert("You’ve been logged out due to inactivity.");
        signOut(auth);
        window.location.href = "/auth/login";
      }, timeoutMinutes * 60 * 1000); // e.g., 15 mins
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => document.addEventListener(event, resetTimer));

    resetTimer(); // Initial start

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach((event) => document.removeEventListener(event, resetTimer));
    };
  }, [timeoutMinutes]);
}
