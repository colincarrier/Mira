import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
});

function Home() {
  const [notes] = useState([
    { id: 1, content: "Welcome to Mira! Your intelligent memory assistant.", createdAt: new Date().toISOString() }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900">Mira</h1>
        <p className="text-gray-600 mb-6">Your intelligent memory assistant</p>
        
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-900">{note.content}</p>
              <div className="text-sm text-gray-500 mt-2">
                {new Date(note.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
        
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center text-2xl">
          +
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}