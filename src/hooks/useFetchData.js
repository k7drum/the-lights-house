import { useEffect, useState } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import dayjs from "dayjs";

export const useFetchData = () => {
  const [blogs, setBlogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "blogs"));
        const blogList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBlogs(blogList);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      }
    };

    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const eventList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventList);

        const upcoming = eventList
          .filter(e => dayjs(e.date).isAfter(dayjs()))
          .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))[0];

        setNextEvent(upcoming || null);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchBlogs();
    fetchEvents();
  }, []);

  return { blogs, events, nextEvent };
};
