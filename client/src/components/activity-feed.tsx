import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Mic, Filter } from "lucide-react";
import type { NoteWithTodos } from "@shared/schema";
import NoteCard from "./note-card";
import { formatDistanceToNow } from "date-fns";

export default function ActivityFeed() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "voice" | "text" | "hasAI" | "todos">("all");
  
  const { data: notes, isLoading } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
  });

  const filteredNotes = notes?.filter(note => {
    const matchesSearch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterBy === "all" || 
      (filterBy === "voice" && note.mode === "voice") ||
      (filterBy === "text" && note.mode === "text") ||
      (filterBy === "hasAI" && note.aiSuggestion) ||
      (filterBy === "todos" && note.todos.length > 0);
    
    return matchesSearch && matchesFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
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
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-[hsl(var(--muted-foreground))]">No notes yet. Start by capturing your first thought!</p>
        </div>
      </div>
    );
  }

  const lastUpdate = filteredNotes[0]?.createdAt 
    ? formatDistanceToNow(new Date(filteredNotes[0].createdAt), { addSuffix: true })
    : "Never";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <span className="text-sm text-[hsl(var(--ios-gray))]">{lastUpdate}</span>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setFilterBy("all")}
          className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
            filterBy === "all" 
              ? "bg-[hsl(var(--ocean-blue))] text-white" 
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterBy("voice")}
          className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
            filterBy === "voice" 
              ? "bg-[hsl(var(--ocean-blue))] text-white" 
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          Voice
        </button>
        <button
          onClick={() => setFilterBy("text")}
          className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
            filterBy === "text" 
              ? "bg-[hsl(var(--ocean-blue))] text-white" 
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          Text
        </button>
        <button
          onClick={() => setFilterBy("hasAI")}
          className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
            filterBy === "hasAI" 
              ? "bg-[hsl(var(--ocean-blue))] text-white" 
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          AI Enhanced
        </button>
        <button
          onClick={() => setFilterBy("todos")}
          className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap ${
            filterBy === "todos" 
              ? "bg-[hsl(var(--ocean-blue))] text-white" 
              : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          }`}
        >
          Has Todos
        </button>
      </div>

      <div className="space-y-4">
        {filteredNotes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>

      {/* Search Bar */}
      <div className="mt-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[hsl(var(--ocean-blue))] rounded-full flex items-center justify-center">
            <Mic className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
