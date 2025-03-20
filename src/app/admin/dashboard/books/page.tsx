"use client";
import { useState, useEffect } from "react";
import { db, storage } from "@/config/firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Trash2, Edit, Plus, Upload, Download } from "lucide-react";

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    category: "",
    bookFile: null,
    bookFileUrl: "",
    coverImage: null,
    coverImageUrl: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  // ✅ Fetch Books from Firestore
  const fetchBooks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "books"));
      const bookList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBooks(bookList);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  // ✅ Handle File Upload
  const handleFileUpload = async (file: File | null, path: string) => {
    if (!file) return "";
    const storageRef = ref(storage, `${path}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // ✅ Add or Update Book
  const saveBook = async () => {
    if (!newBook.title || !newBook.author) {
      alert("Please fill all required fields!");
      return;
    }

    setSaving(true);
    try {
      let bookFileUrl = newBook.bookFileUrl;
      let coverImageUrl = newBook.coverImageUrl;

      if (newBook.bookFile) {
        bookFileUrl = await handleFileUpload(newBook.bookFile, "books/files");
      }
      if (newBook.coverImage) {
        coverImageUrl = await handleFileUpload(newBook.coverImage, "books/covers");
      }

      if (editingBook) {
        await updateDoc(doc(db, "books", editingBook.id), {
          title: newBook.title,
          author: newBook.author,
          category: newBook.category,
          bookFileUrl,
          coverImageUrl,
        });
      } else {
        await addDoc(collection(db, "books"), {
          title: newBook.title,
          author: newBook.author,
          category: newBook.category,
          bookFileUrl,
          coverImageUrl,
          createdAt: new Date(),
        });
      }

      setNewBook({ title: "", author: "", category: "", bookFile: null, bookFileUrl: "", coverImage: null, coverImageUrl: "" });
      setEditingBook(null);
      fetchBooks();
      alert("Book Saved Successfully!");
    } catch (error) {
      console.error("Error saving book:", error);
      alert("Failed to save book.");
    }
    setSaving(false);
  };

  // ✅ Edit Book
  const editBook = (book: any) => {
    setEditingBook(book);
    setNewBook({
      title: book.title,
      author: book.author,
      category: book.category,
      bookFileUrl: book.bookFileUrl || "",
      coverImageUrl: book.coverImageUrl || "",
    });
  };

  // ✅ Delete Book
  const deleteBook = async (id: string) => {
    try {
      await deleteDoc(doc(db, "books", id));
      fetchBooks();
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Books Management</h1>

      {/* Add or Edit Book Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">{editingBook ? "Edit Book" : "Add New Book"}</h2>
        <div className="grid grid-cols-2 gap-4">
          <label>
            Title:
            <input
              type="text"
              placeholder="Book Title"
              value={newBook.title}
              onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </label>
          <label>
            Author:
            <input
              type="text"
              placeholder="Author Name"
              value={newBook.author}
              onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </label>
          <label>
            Category:
            <input
              type="text"
              placeholder="Category"
              value={newBook.category}
              onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </label>
          <label>
            Upload Book File (PDF):
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setNewBook({ ...newBook, bookFile: e.target.files?.[0] || null })}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </label>
          <label>
            Upload Cover Image:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewBook({ ...newBook, coverImage: e.target.files?.[0] || null })}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </label>
        </div>
        <button onClick={saveBook} disabled={saving} className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center">
          {saving ? "Saving..." : <><Upload className="mr-2" /> {editingBook ? "Update Book" : "Save Book"}</>}
        </button>
      </div>

      {/* Books History List */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">Books List</h2>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="p-2">Title</th>
              <th className="p-2">Author</th>
              <th className="p-2">Category</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td className="p-2">{book.title}</td>
                <td className="p-2">{book.author}</td>
                <td className="p-2">{book.category}</td>
                <td className="p-2 flex space-x-2">
                  {book.bookFileUrl && (
                    <a href={book.bookFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 flex items-center">
                      <Download className="mr-1" /> Download Book
                    </a>
                  )}
                  <button onClick={() => editBook(book)} className="text-blue-400">
                    <Edit />
                  </button>
                  <button onClick={() => deleteBook(book.id)} className="text-red-500">
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
