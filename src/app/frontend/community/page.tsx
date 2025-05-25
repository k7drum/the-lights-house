// src/app/frontend/community/page.tsx
"use client";

import React, { useState, useEffect, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "@/config/firebaseConfig";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ThumbsUp, MessageCircle, Share2, Smile } from "lucide-react";
import dynamic from "next/dynamic";

dayjs.extend(relativeTime);

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  mediaURL: string | null;
  mediaType: string | null;
  likes: string[];
  createdAt: { seconds: number; nanoseconds: number } | null;
}

interface Comment {
  id: string;
  authorName: string;
  text: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export default function CommunityPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [newText, setNewText] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Comments
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const commentInputs = useRef<Record<string, string>>({});
  const [showCommentEmojiFor, setShowCommentEmojiFor] = useState<string | null>(null);

  // 1) Require login
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) router.push("/auth/login");
      else setUser(u);
      setLoadingAuth(false);
    });
    return unsub;
  }, [router]);

  // 2) Subscribe to posts
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "communityPosts"),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snap) => {
      setPosts(
        snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            authorId: data.authorId,
            authorName: data.authorName,
            text: data.text,
            mediaURL: data.mediaURL || null,
            mediaType: data.mediaType || null,
            likes: data.likes || [],
            createdAt: data.createdAt || null,
          } as Post;
        })
      );
    });
  }, [user]);

  // 3) Subscribe to comments
  useEffect(() => {
    if (!openCommentsFor) return;
    const q = query(
      collection(db, "communityPosts", openCommentsFor, "comments"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snap) => {
      setComments((c) => ({
        ...c,
        [openCommentsFor]: snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        })),
      }));
    });
  }, [openCommentsFor]);

  if (loadingAuth) {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
        <p>Checking authentication…</p>
      </div>
    );
  }

  // Post handlers
  const handlePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!newText.trim() && !newFile) return;
    setPosting(true);

    let mediaURL: string | null = null,
      mediaType: string | null = null;

    if (newFile) {
      const path = `community/${Date.now()}_${newFile.name}`;
      const snap = await uploadBytes(ref(storage, path), newFile);
      mediaURL = await getDownloadURL(snap.ref);
      if (newFile.type.startsWith("image/")) mediaType = "image";
      else if (newFile.type.startsWith("video/")) mediaType = "video";
      else if (newFile.type.startsWith("audio/")) mediaType = "audio";
      else mediaType = "file";
    }

    await addDoc(collection(db, "communityPosts"), {
      authorId: user.uid,
      authorName: user.displayName || "Guest",
      text: newText.trim(),
      mediaURL,
      mediaType,
      likes: [],
      createdAt: serverTimestamp(),
    });

    setNewText("");
    setNewFile(null);
    setPosting(false);
  };

  const toggleLike = async (post: Post) => {
    const refDoc = doc(db, "communityPosts", post.id);
    const hasLiked = post.likes.includes(user.uid);
    await updateDoc(refDoc, {
      likes: hasLiked
        ? arrayRemove(user.uid)
        : arrayUnion(user.uid),
    });
  };

  const handleShare = (post: Post) => {
    const shareUrl = `${window.location.origin}/frontend/community?post=${post.id}`;
    if (navigator.share) {
      navigator.share({
        title: post.text.slice(0, 50),
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    }
  };

  const handleComment = async (postId: string) => {
    const txt = commentInputs.current[postId]?.trim();
    if (!txt) return;
    await addDoc(
      collection(db, "communityPosts", postId, "comments"),
      {
        authorName: user.displayName || "Guest",
        text: txt,
        createdAt: serverTimestamp(),
      }
    );
    commentInputs.current[postId] = "";
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-6 space-y-6">
      <motion.h1
        className="text-4xl font-bold text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Community Feed
      </motion.h1>

      {/* New Post */}
      <motion.form
        onSubmit={handlePost}
        className="bg-gray-800 p-6 rounded-xl shadow-xl space-y-4 relative"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-start space-x-4">
          <img
            src={user.photoURL || "/default-avatar.png"}
            alt="You"
            className="w-12 h-12 rounded-full border-2 border-yellow-500 object-cover"
          />
          <div className="flex-1 space-y-2">
            <textarea
              rows={3}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="What’s on your mind?"
              className="w-full p-3 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-400"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <label className="cursor-pointer text-gray-400 hover:text-white">
                  📷
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="text-gray-400 hover:text-white"
                >
                  <Smile size={20} />
                </button>
              </div>
              <button
                type="submit"
                disabled={posting}
                className="bg-yellow-500 text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-600 disabled:opacity-50"
              >
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>

        {showEmojiPicker && (
          <div className="absolute bottom-20 left-20 z-50">
            <EmojiPicker
              onEmojiClick={(emojiData) =>
                setNewText((t) => t + emojiData.emoji)
              }
              theme="dark"
            />
          </div>
        )}
      </motion.form>

      {/* Posts */}
      <div className="space-y-8">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              className="bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src="/default-avatar.png"
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{post.authorName}</p>
                    <p className="text-xs text-gray-400">
                      {post.createdAt
                        ? dayjs(post.createdAt.seconds * 1000).fromNow()
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Text & Media */}
              <div className="mb-4 whitespace-pre-wrap">{post.text}</div>
              {post.mediaURL && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  {post.mediaType === "image" && (
                    <img
                      src={post.mediaURL}
                      className="w-full object-cover"
                      alt=""
                    />
                  )}
                  {post.mediaType === "video" && (
                    <video controls src={post.mediaURL} className="w-full" />
                  )}
                  {post.mediaType === "audio" && (
                    <audio controls src={post.mediaURL} className="w-full" />
                  )}
                  {post.mediaType === "file" && (
                    <a
                      href={post.mediaURL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-yellow-400 hover:underline"
                    >
                      Download file
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between text-gray-400">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => toggleLike(post)}
                    className="flex items-center space-x-1 hover:text-yellow-400"
                  >
                    <ThumbsUp />{" "}
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  <button
                    onClick={() =>
                      setOpenCommentsFor(
                        openCommentsFor === post.id ? null : post.id
                      )
                    }
                    className="flex items-center space-x-1 hover:text-yellow-400"
                  >
                    <MessageCircle />{" "}
                    <span>{comments[post.id]?.length || 0}</span>
                  </button>
                  <button
                    onClick={() => handleShare(post)}
                    className="flex items-center space-x-1 hover:text-yellow-400"
                  >
                    <Share2 />
                  </button>
                </div>
              </div>

              {/* Comments */}
              {openCommentsFor === post.id && (
                <motion.div
                  className="mt-4 border-t border-gray-700 pt-4 space-y-4"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                >
                  {(comments[post.id] || []).map((c) => (
                    <div key={c.id} className="flex items-start space-x-3">
                      <img
                        src="/default-avatar.png"
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="text-sm">
                          <span className="font-semibold">
                            {c.authorName}
                          </span>{" "}
                          {c.text}
                        </p>
                        <p className="text-xs text-gray-500">
                          {c.createdAt
                            ? dayjs(c.createdAt.seconds * 1000).fromNow()
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Add a comment…"
                      className="flex-1 bg-gray-700 p-2 rounded-lg focus:ring-2 focus:ring-yellow-400"
                      onChange={(e) =>
                        (commentInputs.current[post.id] = e.target.value)
                      }
                    />
                    <button
                      onClick={() => handleComment(post.id)}
                      className="px-3 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600"
                    >
                      Comment
                    </button>
                    <button
                      onClick={() =>
                        setShowCommentEmojiFor(
                          showCommentEmojiFor === post.id ? null : post.id
                        )
                      }
                      className="text-gray-400 hover:text-white"
                    >
                      <Smile size={20} />
                    </button>
                  </div>
                  {showCommentEmojiFor === post.id && (
                    <div className="absolute z-50">
                      <EmojiPicker
                        onEmojiClick={(e) => {
                          const curr = commentInputs.current[post.id] || "";
                          commentInputs.current[post.id] = curr + e.emoji;
                          setShowCommentEmojiFor(null);
                        }}
                        theme="dark"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
