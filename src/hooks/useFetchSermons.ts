// src/hooks/useFetchSermons.ts

import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, DocumentData } from "firebase/firestore";
import dayjs from "dayjs";

interface Sermon {
  id: string;
  date: string;
  title?: string;
  content?: string;
  speaker?: string;
  fileUrl?: string;
  // ...any other known fields
  [key: string]: any;
}

export const useFetchSermons = () => {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchSermons() {
      try {
        const snap = await getDocs(collection(db, "sermons"));

        // Map and cast to Sermon[] to satisfy TS
        const list = snap.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as DocumentData),
          }))
          .sort((a, b) => dayjs((b.date as string)).diff(dayjs(a.date as string)));

        setSermons(list as Sermon[]);
      } catch (err) {
        console.error("Error loading sermons:", err);
        setError("Failed to load sermons.");
      } finally {
        setLoading(false);
      }
    }

    fetchSermons();
  }, []);

  return { sermons, loading, error };
};
