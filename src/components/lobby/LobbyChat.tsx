"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebaseConfig";

interface Message {
  id: string;
  text: string;
  userName: string;
  createdAt: { seconds: number; nanoseconds: number };
}

interface LobbyChatProps {
  userName: string;
  roomId: string;
}

export default function LobbyChat({ userName, roomId }: LobbyChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // subscribe
  useEffect(() => {
    const q = query(
      collection(db, roomId),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      const msgs: Message[] = [];
      const users = new Set<string>();
      snap.docs.forEach((d) => {
        const raw = d.data() as any;
        // default timestamp if missing
        const ts = raw.createdAt?.seconds
          ? raw.createdAt
          : { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 };
        msgs.push({
          id: d.id,
          text: raw.text,
          userName: raw.userName,
          createdAt: ts,
        });
        users.add(raw.userName);
      });
      setMessages(msgs);
      setOnlineUsers(users);
    });
  }, [roomId]);

  // scroll on new
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // send
  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await addDoc(collection(db, roomId), {
      text,
      userName,
      createdAt: serverTimestamp(),
    });
  }

  // group by date
  const grouped = messages.reduce((acc: Record<string, Message[]>, msg) => {
    const dt = new Date(msg.createdAt.seconds * 1000);
    const key = dt.toDateString();
    ;(acc[key] ||= []).push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2">
        <h2 className="text-lg font-semibold text-yellow-400">Lobby Chat</h2>
        <span className="text-sm text-gray-400">
          {onlineUsers.size} user{onlineUsers.size !== 1 && "s"} online
        </span>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-6">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            No messages yet — say hello!
          </p>
        )}

        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="sticky top-0 bg-gray-800 text-center py-1 z-10">
              <span className="inline-block bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs">
                {new Date(date).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            {msgs.map((msg) => {
              const dt = new Date(msg.createdAt.seconds * 1000);
              const time = dt.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              });
              const isMe = msg.userName === userName;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex max-w-[75%] ${
                    isMe ? "ml-auto" : ""
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl shadow-md hover:shadow-lg transition-colors break-words ${
                      isMe
                        ? "bg-yellow-500 text-black"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1">
                      {msg.userName}
                    </div>
                    <div>{msg.text}</div>
                    <div className="text-[10px] text-gray-300 mt-1 text-right">
                      {time}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* input */}
      <form
        onSubmit={handleSend}
        className="flex items-center p-3 bg-gray-900 border-t border-gray-700"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          className="flex-1 bg-gray-800 text-white placeholder-gray-500 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="ml-3 bg-yellow-500 text-black px-4 py-2 rounded-full font-semibold hover:bg-yellow-600 disabled:opacity-50 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
