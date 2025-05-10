import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export const useFetchBlogsEvents = () => {
  const [blogs, setBlogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const blogsSnap = await getDocs(collection(db, "blogs"));
        const eventsSnap = await getDocs(collection(db, "events"));

        setBlogs(blogsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setEvents(eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching blogs/events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { blogs, events, loading };
};
