"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { db, storage } from "@/config/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  query,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Trash2,
  UploadCloud,
  ThumbsUp,
  MessageCircle,
  Share2,
} from "lucide-react";

interface Post {
  id: string;
  content: string;
  imageUrl: string;
  createdAt: { toDate: () => Date } | Date;
  likes: number;
  comments: string[];
}

export default function SocialPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState<{
    content: string;
    imageFile: File | null;
    imageUrl: string;
  }>({ content: "", imageFile: null, imageUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const q = query(
      collection(db, "social"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Post, "id">),
    }));
    setPosts(list);
  };

  const handleImageUpload = async (file: File | null): Promise<string | null> => {
    if (!file) return null;
    const storageRef = ref(storage, `social/${file.name}`);
    const snap = await uploadBytes(storageRef, file);
    return getDownloadURL(snap.ref);
  };

  const addPost = async () => {
    if (!newPost.content.trim() && !newPost.imageFile) {
      alert("Post content or image is required!");
      return;
    }
    setUploading(true);
    try {
      let imageUrl = newPost.imageUrl;
      if (newPost.imageFile) {
        const url = await handleImageUpload(newPost.imageFile);
        if (url) imageUrl = url;
      }
      await addDoc(collection(db, "social"), {
        content: newPost.content,
        imageUrl,
        createdAt: new Date(),
        likes: 0,
        comments: [],
      });
      setNewPost({ content: "", imageFile: null, imageUrl: "" });
      fetchPosts();
    } catch (err) {
      console.error("Error adding post:", err);
      alert("Failed to add post.");
    } finally {
      setUploading(false);
    }
  };

  const deletePost = async (id: string) => {
    await deleteDoc(doc(db, "social", id));
    fetchPosts();
  };

  const likePost = async (id: string, currentLikes: number) => {
    await updateDoc(doc(db, "social", id), { likes: currentLikes + 1 });
    fetchPosts();
  };

  const addComment = async (postId: string) => {
    const comment = newComment[postId]?.trim();
    if (!comment) return;
    await updateDoc(doc(db, "social", postId), {
      comments: arrayUnion(comment),
    });
    setNewComment((prev) => ({ ...prev, [postId]: "" }));
    fetchPosts();
  };

  const sharePost = (postId: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    alert("Post link copied to clipboard!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Social Engagement</h1>

      {/* Create Post */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Create a Post</h2>
        <textarea
          placeholder="What's on your mind?"
          value={newPost.content}
          onChange={(e) =>
            setNewPost((prev) => ({ ...prev, content: e.target.value }))
          }
          className="w-full p-2 bg-gray-700 rounded text-white"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setNewPost((prev) => ({
              ...prev,
              imageFile: e.target.files?.[0] ?? null,
            }))
          }
          className="mt-2"
        />
        <button
          onClick={addPost}
          disabled={uploading}
          className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center"
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <UploadCloud className="mr-2" /> Post
            </>
          )}
        </button>
      </div>

      {/* Community Feed */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Community Feed</h2>
        <div className="space-y-4">
          {posts.map((post) => {
            const createdAt =
              post.createdAt instanceof Date
                ? post.createdAt
                : post.createdAt.toDate();
            return (
              <div
                key={post.id}
                className="bg-gray-900 p-4 rounded-lg shadow-md"
              >
                <p className="text-white">{post.content}</p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post"
                    className="w-full mt-2 rounded"
                  />
                )}
                <div className="flex justify-between items-center mt-2 text-gray-400 text-sm">
                  <span>
                    {createdAt.toLocaleDateString()}{" "}
                    {createdAt.toLocaleTimeString()}
                  </span>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => likePost(post.id, post.likes)}
                      className="flex items-center text-blue-400"
                    >
                      <ThumbsUp className="mr-1" /> {post.likes}
                    </button>
                    <button
                      onClick={() => sharePost(post.id)}
                      className="flex items-center text-green-400"
                    >
                      <Share2 className="mr-1" /> Share
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-500"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div className="mt-4">
                  <h3 className="text-sm text-gray-400 mb-1">Comments</h3>
                  {post.comments.map((c, i) => (
                    <p
                      key={i}
                      className="bg-gray-800 p-2 rounded mt-1 text-white"
                    >
                      {c}
                    </p>
                  ))}
                  <div className="flex mt-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={newComment[post.id] ?? ""}
                      onChange={(e) =>
                        setNewComment((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      className="flex-1 p-2 bg-gray-700 rounded text-white"
                    />
                    <button
                      onClick={() => addComment(post.id)}
                      className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg"
                    >
                      <MessageCircle />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
