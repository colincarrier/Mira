import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Collection, NoteWithTodos } from "@shared/schema";

export default function SimpleHome() {
  const [activeTab, setActiveTab] = useState<"activity" | "todos" | "collections">("collections");

  const { data: collections, isLoading: collectionsLoading } = useQuery<Collection[]>({
    queryKey: ["/api/collections"],
  });

  const { data: notes, isLoading: notesLoading } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
  });

  if (collectionsLoading || notesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-white border-b px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Mira</h1>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "activity"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab("todos")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "todos"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              To-dos
            </button>
            <button
              onClick={() => setActiveTab("collections")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "collections"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              Collections
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4">
          {activeTab === "collections" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Collections ({collections?.length || 0})</h2>
              <div className="grid grid-cols-2 gap-3">
                {collections?.map((collection) => (
                  <div
                    key={collection.id}
                    className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => window.location.href = `/collection/${collection.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {collection.icon === "play" && "▶️"}
                        {collection.icon === "checklist" && "✅"}
                        {collection.icon === "shopping-cart" && "🛒"}
                        {collection.icon === "home" && "🏠"}
                        {collection.icon === "briefcase" && "💼"}
                        {collection.icon === "user" && "👤"}
                        {collection.icon === "users" && "👥"}
                        {collection.icon === "map-pin" && "📍"}
                        {collection.icon === "book" && "📚"}
                        {collection.icon === "utensils" && "🍽️"}
                        {collection.icon === "heart" && "❤️"}
                        {collection.icon === "folder" && "📁"}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{collection.name}</h3>
                        <p className="text-xs text-gray-500">
                          Collection
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {notes?.slice(0, 10).map((note) => (
                  <div key={note.id} className="bg-white border rounded-lg p-3 shadow-sm">
                    <p className="text-sm text-gray-900">{note.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "todos" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">To-dos</h2>
              <div className="space-y-3">
                {notes?.flatMap(note => note.todos || []).map((todo) => (
                  <div key={todo.id} className="bg-white border rounded-lg p-3 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={todo.completed || false}
                        className="rounded"
                        readOnly
                      />
                      <span className={`text-sm ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {todo.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}