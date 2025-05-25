"use client";
import React, { useState, useEffect, ChangeEvent } from "react";
import { db, storage } from "@/config/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Trash2, Edit, Upload, Download } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  bookFileUrl?: string;
  coverImageUrl?: string;
}

interface NewBook {
  title: string;
  author: string;
  category: string;
  bookFile: File | null;
  bookFileUrl: string;
  coverImage: File | null;
  coverImageUrl: string;
}

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [newBook, setNewBook] = useState<NewBook>({
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

  const fetchBooks = async () => {
    try {
      const snapshot = await getDocs(collection(db, "books"));
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Book, "id">),
      }));
      setBooks(list);
    } catch (err) {
      console.error("Error fetching books:", err);
    }
  };

  const handleFileUpload = async (
    file: File | null,
    path: string
  ): Promise<string> => {
    if (!file) return "";
    const storageRef = ref(storage, `${path}/${file.name}`);
    const snap = await uploadBytes(storageRef, file);
    return getDownloadURL(snap.ref);
  };

  const saveBook = async () => {
    if (!newBook.title || !newBook.author) {
      alert("Please fill all required fields!");
      return;
    }

    setSaving(true);
    try {
      let { bookFileUrl, coverImageUrl } = newBook;

      if (newBook.bookFile) {
        bookFileUrl = await handleFileUpload(
          newBook.bookFile,
          "books/files"
        );
      }
      if (newBook.coverImage) {
        coverImageUrl = await handleFileUpload(
          newBook.coverImage,
          "books/covers"
        );
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

      setNewBook({
        title: "",
        author: "",
        category: "",
        bookFile: null,
        bookFileUrl: "",
        coverImage: null,
        coverImageUrl: "",
      });
      setEditingBook(null);
      await fetchBooks();
      alert("Book saved successfully!");
    } catch (err) {
      console.error("Error saving book:", err);
      alert("Failed to save book.");
    } finally {
      setSaving(false);
    }
  };

  const editBook = (book: Book) => {
    setEditingBook(book);
    setNewBook({
      title: book.title,
      author: book.author,
      category: book.category,
      bookFile: null,
      bookFileUrl: book.bookFileUrl || "",
      coverImage: null,
      coverImageUrl: book.coverImageUrl || "",
    });
  };

  const deleteBook = async (id: string) => {
    try {
      await deleteDoc(doc(db, "books", id));
      fetchBooks();
    } catch (err) {
      console.error("Error deleting book:", err);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>
  ): void => {
    setNewBook({
      ...newBook,
      [e.target.name]: e.target.value,
    } as Pick<NewBook, keyof NewBook>);
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: "bookFile" | "coverImage"
  ): void => {
    const file = e.target.files?.[0] ?? null;
    setNewBook({
      ...newBook,
      [field]: file,
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Books Management</h1>

      {/* Add / Edit Form */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-2">
          {editingBook ? "Edit Book" : "Add New Book"}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <label>
            Title:
            <input
              name="title"
              type="text"
              placeholder="Book Title"
              value={newBook.title}
              onChange={handleInputChange}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </label>
          <label>
            Author:
            <input
              name="author"
              type="text"
              placeholder="Author Name"
              value={newBook.author}
              onChange={handleInputChange}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </label>
          <label>
            Category:
            <input
              name="category"
              type="text"
              placeholder="Category"
              value={newBook.category}
              onChange={handleInputChange}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </label>
          <label>
            Upload Book File (PDF):
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileChange(e, "bookFile")}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </label>
          <label>
            Upload Cover Image:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, "coverImage")}
              className="p-2 bg-gray-700 rounded w-full"
            />
          </label>
        </div>
        <button
          onClick={saveBook}
          disabled={saving}
          className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white flex items-center"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Upload className="mr-2" />
              {editingBook ? "Update Book" : "Save Book"}
            </>
          )}
        </button>
      </div>

      {/* Books List */}
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
                    <a
                      href={book.bookFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 flex items-center"
                    >
                      <Download className="mr-1" />
                      Download
                    </a>
                  )}
                  <button
                    onClick={() => editBook(book)}
                    className="text-blue-400"
                  >
                    <Edit />
                  </button>
                  <button
                    onClick={() => deleteBook(book.id)}
                    className="text-red-500"
                  >
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
