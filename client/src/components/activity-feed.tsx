import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, List, Grid } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NoteWithTodos } from "@shared/schema";
import NoteCard from "./note-card";

interface ActivityFeedProps {
  onTodoModalClose?: () => void;
}

export default function ActivityFeed({ onTodoModalClose }: ActivityFeedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isCondensedView, setIsCondensedView] = useState(false);
  
  const { data: notes, isLoading } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
    staleTime: 120000, // Cache for 2 minutes for faster navigation
    gcTime: 600000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Debug logging to see what data we're getting
  console.log("ActivityFeed - notes data:", notes);
  console.log("ActivityFeed - isLoading:", isLoading);

  const filteredNotes = notes?.filter(note => {
    return note.content.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4 pt-6">
          <h2 className="text-2xl font-serif font-medium">Notes</h2>
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
        <div className="flex items-center justify-between mb-4 pt-6">
          <h2 className="text-2xl font-serif font-medium">Notes</h2>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 px-4 pt-6">
        <h2 className="text-2xl font-serif font-medium">Notes</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCondensedView(!isCondensedView)}
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg"
            title={isCondensedView ? "Switch to expanded view" : "Switch to condensed view"}
          >
            {isCondensedView ? <Grid className="w-5 h-5" /> : <List className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-[hsl(var(--muted))] rounded-lg"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
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

      <div className={isCondensedView ? "space-y-2" : "space-y-4"}>
        {filteredNotes.map((note) => (
          isCondensedView ? (
            <div 
              key={note.id}
              className="flex items-center justify-between p-3 bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
              onClick={() => window.location.href = `/note/${note.id}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                  {note.content.split('\n')[0] || 'Untitled note'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
                      .replace('about ', '').replace(' hours', 'h').replace(' hour', 'h')
                      .replace(' minutes', 'm').replace(' minute', 'm').replace(' days', 'd')
                      .replace(' day', 'd').replace(' weeks', 'w').replace(' week', 'w')
                      .replace('less than a minute', 'less than a min')
                      .replace('less than am', 'less than a min')}
                  </span>
                  {note.todos && note.todos.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {note.todos.length} todos
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <NoteCard key={note.id} note={note} onTodoModalClose={onTodoModalClose} />
          )
        ))}
      </div>
    </div>
  );
}
