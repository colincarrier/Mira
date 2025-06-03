import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import type { NoteWithTodos } from "@shared/schema";
import NoteCard from "./note-card";

interface ActivityFeedProps {
  onTodoModalClose?: () => void;
}

export default function ActivityFeed({ onTodoModalClose }: ActivityFeedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  const { data: notes, isLoading } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
  });

  const filteredNotes = notes?.filter(note => {
    return note.content.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="note-card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!notes || notes.length === 0) {
    return (
      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Notes</h2>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-[hsl(var(--muted-foreground))]">No notes yet. Start by capturing your first thought!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Notes</h2>
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {showSearch && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm"
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredNotes.map((note) => (
          <NoteCard key={note.id} note={note} onTodoModalClose={onTodoModalClose} />
        ))}
      </div>
    </div>
  );
}
