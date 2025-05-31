import { useQuery } from "@tanstack/react-query";
import type { NoteWithTodos } from "@shared/schema";
import NoteCard from "./note-card";
import { formatDistanceToNow } from "date-fns";

export default function ActivityFeed() {
  const { data: notes, isLoading } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
  });

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
          <p className="text-[hsl(var(--ios-gray))]">No notes yet. Start by capturing your first thought!</p>
        </div>
      </div>
    );
  }

  const lastUpdate = notes[0]?.createdAt 
    ? formatDistanceToNow(new Date(notes[0].createdAt), { addSuffix: true })
    : "Never";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <span className="text-sm text-[hsl(var(--ios-gray))]">{lastUpdate}</span>
      </div>

      <div className="space-y-4">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}
