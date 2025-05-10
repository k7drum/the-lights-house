import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";

export const useFetchSermons = () => {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(collection(db, "sermons"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
        setSermons(list);
      } catch (err) {
        setError("Failed to load sermons.");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return { sermons, loading, error };
};
