"use client";
import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import "grapesjs/dist/css/grapes.min.css"; 
import "grapesjs-preset-webpage"; 
import { db } from "@/config/firebaseConfig";
import { collection, addDoc, updateDoc, doc, getDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, FilePlus } from "lucide-react";
import Link from "next/link";

// ✅ Prebuilt Templates
const templates = {
  homepage: `
    <section style="text-align: center; padding: 50px;">
      <h1>Welcome to The Light's House</h1>
      <p>A place of worship and community.</p>
      <button style="padding: 10px 20px; background: red; color: white; border: none;">Join Us</button>
    </section>
  `,
  aboutUs: `
    <section style="padding: 40px;">
      <h1>About Us</h1>
      <p>We are a church dedicated to spreading faith and love.</p>
    </section>
  `,
  contactUs: `
    <section style="padding: 40px;">
      <h1>Contact Us</h1>
      <form>
        <input type="text" placeholder="Your Name" style="display: block; margin-bottom: 10px; padding: 5px;">
        <input type="email" placeholder="Your Email" style="display: block; margin-bottom: 10px; padding: 5px;">
        <button type="submit" style="padding: 10px 20px; background: blue; color: white;">Send</button>
      </form>
    </section>
  `,
};

export default function PageEditor() {
  const editorRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageId = searchParams.get("id");

  useEffect(() => {
    if (!editorRef.current) {
      const editor = grapesjs.init({
        container: "#gjs",
        height: "80vh",
        fromElement: true,
        storageManager: { type: "none" },
        panels: { defaults: [] },
        plugins: ["grapesjs-preset-webpage"],
      });

      editorRef.current = editor;

      if (pageId) {
        loadPageContent(pageId, editor);
      }
    }
  }, [pageId]);

  // ✅ Load Page Content
  const loadPageContent = async (id, editor) => {
    try {
      const pageRef = doc(db, "pages", id);
      const pageSnap = await getDoc(pageRef);
      if (pageSnap.exists()) {
        const pageData = pageSnap.data();
        editor.setComponents(pageData.html || "");
      }
    } catch (error) {
      console.error("Error loading page:", error);
    }
  };

  // ✅ Apply Template
  const applyTemplate = () => {
    if (!editorRef.current || !selectedTemplate) return;
    editorRef.current.setComponents(templates[selectedTemplate]);
  };

  // ✅ Save or Update Page
  const savePage = async (publish = false) => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const html = editor.getHtml();

    setLoading(true);

    try {
      if (pageId) {
        await updateDoc(doc(db, "pages", pageId), { html, status: publish ? "published" : "draft" });
      } else {
        await addDoc(collection(db, "pages"), { html, status: publish ? "published" : "draft", createdAt: new Date() });
      }

      alert(publish ? "Page published successfully!" : "Page saved as draft!");
      router.push("/admin/dashboard/pages");
    } catch (error) {
      console.error("Error saving page:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <Link href="/admin/dashboard/pages">
          <button className="px-4 py-2 bg-gray-500 text-white rounded flex items-center">
            <ArrowLeft className="mr-2" /> Back to Pages
          </button>
        </Link>
        <h1 className="text-2xl font-bold">{pageId ? "Edit Page" : "Create New Page"}</h1>
      </div>

      {/* ✅ Template Selection */}
      <div className="mb-4">
        <label className="text-gray-300">Choose a Template:</label>
        <select onChange={(e) => setSelectedTemplate(e.target.value)} className="p-2 bg-gray-700 rounded w-full">
          <option value="">-- Select a Template --</option>
          <option value="homepage">Homepage</option>
          <option value="aboutUs">About Us</option>
          <option value="contactUs">Contact Us</option>
        </select>
        <button onClick={applyTemplate} className="px-4 py-2 bg-blue-500 text-white rounded mt-2">
          Apply Template
        </button>
      </div>

      {/* ✅ GrapesJS Editor */}
      <div id="gjs" className="border border-gray-700 rounded"></div>

      {/* ✅ Save Buttons */}
      <div className="flex space-x-2 mt-4">
        <button onClick={() => savePage(false)} disabled={loading} className="px-4 py-2 bg-gray-500 text-white rounded-lg">
          <Save className="mr-2" /> {loading ? "Saving..." : "Save Draft"}
        </button>
        <button onClick={() => savePage(true)} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg">
          <Save className="mr-2" /> {loading ? "Publishing..." : "Publish Page"}
        </button>
      </div>
    </div>
  );
}
