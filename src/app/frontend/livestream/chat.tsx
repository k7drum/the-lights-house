// src/app/frontend/livestream/chat.tsx
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signInAnonymously, signOut, User } from "firebase/auth";
import { db, auth } from "@/config/firebaseConfig";
import {
  Trash2,
  Smile,
  Send,
  LogOut,
  ThumbsUp,
  Heart,
  Laugh,
} from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface Message {
  id: string;
  text: string;
  name: string;
  uid: string | null;
  avatar: string;
  reactions?: Record<string, string>;
  timestamp: any;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // 1) Firestore subscription
  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("timestamp", "asc")
    );
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Message, "id">),
      })));
    });
  }, []);

  // 2) Auth state: pick up existing user or anon
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
      } else {
        // no user? sign in anonymously
        const res = await signInAnonymously(auth);
        setUser(res.user);
      }
    });
    return () => unsub();
  }, []);

  // 3) Send
  const sendMessage = async () => {
    if (!message.trim() || !user) return;
    await addDoc(collection(db, "messages"), {
      text: message,
      name: user.displayName || "Guest",
      uid: user.uid,
      avatar: user.photoURL || "/default-avatar.png",
      reactions: {},
      timestamp: serverTimestamp(),
    });
    setMessage("");
    setIsTyping(false);
  };

  // 4) Delete
  const deleteMessage = async (id: string, ownerUid: string | null) => {
    if (user?.uid === ownerUid) {
      await deleteDoc(doc(db, "messages", id));
    } else {
      alert("You can only delete your own messages!");
    }
  };

  // 5) Reactions
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const ref = doc(db, "messages", messageId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const reactions = { ...(snap.data().reactions || {}) };
    const uid = user.uid;
    if (reactions[uid] === emoji) delete reactions[uid];
    else reactions[uid] = emoji;
    await updateDoc(ref, { reactions });
  };

  // 6) Typing
  const handleTyping = (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  return (
    <div className="w-full h-[500px] border rounded-lg flex flex-col bg-gray-900 text-white">
      {/* header */}
      <div className="bg-gray-800 p-3 flex justify-between items-center">
        <span className="font-bold text-lg">Live Chat</span>
        {user && (
          <button
            onClick={() => { signOut(auth); }}
            className="text-sm flex items-center"
            title="Sign out of chat"
          >
            Logout <LogOut className="ml-2 w-4 h-4" />
          </button>
        )}
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="flex items-center space-x-3 p-2 border rounded-md bg-gray-700"
          >
            <img
              src={msg.avatar}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
              <strong>{msg.name}:</strong> {msg.text}
              <div className="flex space-x-1 mt-1">
                {Object.values(msg.reactions || {}).map((r, i) => (
                  <span key={i} className="text-xl">{r}</span>
                ))}
              </div>
            </div>
            {/* reaction buttons */}
            <div className="flex space-x-2">
              <button onClick={() => toggleReaction(msg.id, "👍")}>
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button onClick={() => toggleReaction(msg.id, "❤️")}>
                <Heart className="w-4 h-4 text-red-500" />
              </button>
              <button onClick={() => toggleReaction(msg.id, "😂")}>
                <Laugh className="w-4 h-4 text-yellow-400" />
              </button>
            </div>
            {/* delete */}
            {user?.uid === msg.uid && (
              <button
                onClick={() => deleteMessage(msg.id, msg.uid)}
                className="text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {isTyping && (
          <p className="text-sm text-gray-400 mt-2">Someone is typing…</p>
        )}
      </div>

      {/* input */}
      <div className="p-2 flex items-center space-x-2 border-t bg-gray-800 relative">
        <button onClick={() => setShowEmojiPicker(v => !v)}>
          <Smile className="w-6 h-6 text-white" />
        </button>
        {showEmojiPicker && (
          <div className="absolute bottom-12 left-2 bg-white rounded-lg shadow-lg z-50 p-2">
            <EmojiPicker
              onEmojiClick={(e: EmojiClickData) => setMessage(m => m + e.emoji)}
              width={300}
              height={350}
            />
          </div>
        )}
        <input
          type="text"
          value={message}
          onChange={handleTyping}
          placeholder="Type a message…"
          className="flex-1 p-2 border rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
