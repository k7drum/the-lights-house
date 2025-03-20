"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/config/firebaseConfig";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function ChatBox({ livestreamId }: { livestreamId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!livestreamId) return;

    // Fetch messages in real-time
    const q = query(collection(db, `livestreams/${livestreamId}/chats`), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [livestreamId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to send messages.");
      return;
    }

    try {
      await addDoc(collection(db, `livestreams/${livestreamId}/chats`), {
        userId: user.uid,
        username: user.displayName || "Anonymous",
        message: newMessage,
        timestamp: serverTimestamp(),
      });
      setNewMessage(""); // Clear input after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-md w-full max-w-lg">
      <h2 className="text-lg font-semibold mb-2">Live Chat</h2>
      <div className="h-60 overflow-y-auto bg-gray-800 p-2 rounded-lg">
        {messages.length === 0 ? (
          <p className="text-gray-400 text-center">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="p-2 border-b border-gray-700">
              <p className="text-sm font-bold text-red-400">{msg.username}</p>
              <p className="text-gray-300">{msg.message}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-3 flex">
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 bg-gray-700 rounded-l-lg text-white"
        />
        <button onClick={sendMessage} className="bg-red-600 px-4 py-2 rounded-r-lg text-white">
          Send
        </button>
      </div>
    </div>
  );
}
