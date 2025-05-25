// src/hooks/useFetchBlogsEvents.ts

import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs, DocumentData } from "firebase/firestore";

interface Blog extends DocumentData {
  id: string;
  // add other known blog fields here, for example:
  // title: string;
  // excerpt?: string;
  // coverImage?: string;
}

interface EventItem extends DocumentData {
  id: string;
  // add other known event fields here, for example:
  // title: string;
  // date: string;
  // location?: string;
}

export const useFetchBlogsEvents = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const blogsSnap = await getDocs(collection(db, "blogs"));
        const eventsSnap = await getDocs(collection(db, "events"));

        const blogsList: Blog[] = blogsSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Blog, "id">),
        }));

        const eventsList: EventItem[] = eventsSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<EventItem, "id">),
        }));

        setBlogs(blogsList);
        setEvents(eventsList);
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
