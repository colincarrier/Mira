import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"activity" | "todos" | "collections">("activity");

  const { data: notes, isLoading } = useQuery({
    queryKey: ["/api/notes"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mira</h1>
        <p className="text-gray-600">Your intelligent memory assistant</p>
      </header>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "activity" 
              ? "bg-blue-500 text-white" 
              : "bg-white text-gray-700"
          }`}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab("todos")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "todos" 
              ? "bg-blue-500 text-white" 
              : "bg-white text-gray-700"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setActiveTab("collections")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "collections" 
              ? "bg-blue-500 text-white" 
              : "bg-white text-gray-700"
          }`}
        >
          Collections
        </button>
      </div>

      <div className="space-y-4">
        {notes && Array.isArray(notes) ? (
          notes.map((note: any) => (
            <div key={note.id} className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-900">{note.content}</p>
              <div className="text-sm text-gray-500 mt-2">
                {new Date(note.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            No notes yet. Start by creating your first note!
          </div>
        )}
      </div>

      <button className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center text-2xl">
        +
      </button>
    </div>
  );
}