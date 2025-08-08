import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, List, Grid } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import type { NoteWithTodos } from "@shared/schema";
import NoteCard from "./note-card";
import { useRealTimeUpdates } from "@/hooks/use-realtime-updates";
import { queryKeys } from "@/utils/queryKeys";
import { queryClient } from "@/lib/queryClient";

interface ActivityFeedProps {
  onTodoModalClose?: () => void;
}

export default function ActivityFeed({ onTodoModalClose }: ActivityFeedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isCondensedView, setIsCondensedView] = useState(false);
  const [, navigate] = useLocation();
  
  // Enable real-time updates for immediate note visibility
  useRealTimeUpdates();
  
  const { data: notes, isLoading, error, refetch, dataUpdatedAt } = useQuery<NoteWithTodos[]>({
    queryKey: queryKeys.notes.all,
    staleTime: 10000, // 10 seconds
    gcTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    refetchInterval: false,
    networkMode: 'always', // Always attempt network request
  });

  // Debug logging to see what data we're getting
  console.log('[ActivityFeed] State:', {
    isLoading,
    error: error ? String(error) : null,
    notesLength: notes?.length || 0,
    notesType: Array.isArray(notes) ? 'array' : typeof notes,
    dataUpdatedAt: dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : 'never',
  });

  const filteredNotes = notes?.filter(note => {
    return (note.content || '').toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a, b) => {
    // Use createdAt field consistently with null safety
    const aDate = new Date(a.createdAt ?? (a as any).created_at ?? 0);
    const bDate = new Date(b.createdAt ?? (b as any).created_at ?? 0);
    return bDate.getTime() - aDate.getTime();
  }) || [];
  
  // Cap list at 100 items for performance
  const visibleNotes = filteredNotes.slice(0, 100);

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

  if (error) {
    return (
      <div className="space-y-4 px-4">
        <div className="flex items-center justify-between mb-4 pt-6">
          <h2 className="text-2xl font-serif font-medium">Notes</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500">Error loading notes</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">{String(error)}</p>
          <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
            Retry
          </button>
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
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
            Debug: isLoading={isLoading ? 'true' : 'false'}, 
            notesLength={notes?.length || 0}, 
            error={error ? 'yes' : 'no'},
            lastUpdate={dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : 'never'}
          </p>
          <button 
            onClick={() => {
              console.log('[ActivityFeed] Force refetch triggered');
              queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
              queryClient.refetchQueries({ queryKey: queryKeys.notes.all });
              refetch();
            }} 
            className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs"
          >
            Force Refresh (Clear Cache)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 px-4 pt-6">
        <h2 className="text-2xl font-serif font-medium">Notes ({visibleNotes.length})</h2>
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
        {visibleNotes.map((note) => (
          isCondensedView ? (
            <div 
              key={note.id}
              className="flex items-center justify-between p-3 bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
              onClick={() => navigate(`/notes/${note.id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                  {note.content.split('\n')[0] || 'Untitled note'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {formatDistanceToNow(new Date(note.createdAt || (note as any).created_at), { addSuffix: true })
                      .replace('about ', '').replace(' hours', 'h').replace(' hour', 'h')
                      .replace(' minutes', 'm').replace(' minute', 'm').replace(' days', 'd')
                      .replace(' day', 'd').replace(' weeks', 'w').replace(' week', 'w')
                      .replace('less than a minute', 'less than a min')
                      .replace('less than am', 'less than a min')}
                  </span>
                  {note.todos && note.todos.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {(note.todos || []).length} todos
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
