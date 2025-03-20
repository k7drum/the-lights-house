"use client";
import { useState, useEffect } from "react";
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
  Smile,
} from "lucide-react";

export default function SocialPage() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    content: "",
    imageFile: null,
    imageUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const q = query(collection(db, "social"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    setPosts(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleImageUpload = async (file) => {
    if (!file) return null;
    const storageRef = ref(storage, `social/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
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
        imageUrl = await handleImageUpload(newPost.imageFile);
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
    } catch (error) {
      console.error("Error adding post:", error);
    }
    setUploading(false);
  };

  const deletePost = async (id) => {
    await deleteDoc(doc(db, "social", id));
    fetchPosts();
  };

  const likePost = async (id, currentLikes) => {
    await updateDoc(doc(db, "social", id), { likes: currentLikes + 1 });
    fetchPosts();
  };

  const addComment = async (postId) => {
    if (!newComment[postId]?.trim()) return;

    await updateDoc(doc(db, "social", postId), {
      comments: arrayUnion(newComment[postId]),
    });

    setNewComment((prev) => ({ ...prev, [postId]: "" }));
    fetchPosts();
  };

  const sharePost = (postId) => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
    alert("Post link copied to clipboard!");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Social Engagement</h1>

      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Create a Post</h2>
        <textarea
          placeholder="What's on your mind?"
          value={newPost.content}
          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
          className="w-full p-2 bg-gray-700 rounded"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setNewPost({ ...newPost, imageFile: e.target.files[0] })}
          className="mt-2"
        />
        <button
          onClick={addPost}
          disabled={uploading}
          className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center"
        >
          {uploading ? "Uploading..." : <><UploadCloud className="mr-2" /> Post</>}
        </button>
      </div>

      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Community Feed</h2>
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-900 p-4 rounded-lg shadow-md">
              <p className="text-white">{post.content}</p>
              {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full mt-2 rounded" />}
              <div className="flex justify-between items-center mt-2">
                <button onClick={() => likePost(post.id, post.likes)} className="text-blue-400 flex items-center">
                  <ThumbsUp className="mr-2" /> {post.likes} Likes
                </button>
                <button onClick={() => sharePost(post.id)} className="text-green-400 flex items-center">
                  <Share2 className="mr-2" /> Share
                </button>
                <button onClick={() => deletePost(post.id)} className="text-red-500">
                  <Trash2 />
                </button>
              </div>
              <div className="mt-4">
                <h3 className="text-sm text-gray-400">Comments</h3>
                {post.comments?.map((comment, index) => (
                  <p key={index} className="bg-gray-800 p-2 rounded mt-1">{comment}</p>
                ))}
                <div className="flex mt-2">
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment[post.id] || ""}
                    onChange={(e) => setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    className="flex-1 p-2 bg-gray-700 rounded text-white"
                  />
                  <button onClick={() => addComment(post.id)} className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg">
                    <MessageCircle />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
