// src/components/common/Modal.tsx
export default function Modal({ title, description, onClose }) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="text-gray-700 mb-4">{description}</p>
          <button onClick={onClose} className="px-4 py-2 bg-red-600 text-white rounded">
            Stay Logged In
          </button>
        </div>
      </div>
    );
  }
  