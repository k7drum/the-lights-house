"use client";
import { useState, useEffect } from "react";
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";
import { Send } from "lucide-react";

export default function ChatBox({ livestreamId }: { livestreamId: string }) {
  const [messages, setMessages] = useState<{ id: string; text: string; sender: string; createdAt: any }[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!livestreamId) return;

    const messagesRef = collection(db, `livestreams/${livestreamId}/messages`);
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as { id: string; text: string; sender: string; createdAt: any }[];
      setMessages(chatMessages);
    });

    return () => unsubscribe();
  }, [livestreamId]);

  // ✅ Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    await addDoc(collection(db, `livestreams/${livestreamId}/messages`), {
      text: newMessage,
      sender: "Guest", // 🔹 Update this to dynamic user authentication later
      createdAt: new Date(),
    });

    setNewMessage("");
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-md mt-6 w-full max-w-lg mx-auto">
      <h2 className="text-lg font-bold mb-2">Live Chat</h2>

      {/* Chat Messages */}
      <div className="h-60 overflow-y-auto bg-gray-800 p-2 rounded-lg">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <span className="font-bold text-red-400">{msg.sender}: </span>
            <span className="text-white">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Send Message */}
      <div className="flex mt-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 bg-gray-700 text-white rounded-l-lg"
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-red-600 px-4 py-2 rounded-r-lg text-white flex items-center">
          <Send size={18} className="mr-1" /> Send
        </button>
      </div>
    </div>
  );
}
