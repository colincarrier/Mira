import type { NoteWithTodos } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Play, Bot, CheckCircle, Folder } from "lucide-react";

interface NoteCardProps {
  note: NoteWithTodos;
}

const getModeLabel = (mode: string) => {
  switch (mode) {
    case "voice":
      return "Voice Note";
    case "image":
      return "Image Note";
    default:
      return "Text Note";
  }
};

const getModeColor = (mode: string) => {
  switch (mode) {
    case "voice":
      return "bg-[hsl(var(--ocean-blue))]";
    case "image":
      return "bg-[hsl(var(--coral-accent))]";
    default:
      return "bg-[hsl(var(--sea-green))]";
  }
};

export default function NoteCard({ note }: NoteCardProps) {
  const timeAgo = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });

  return (
    <div className="note-card animate-fadeIn">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 ${getModeColor(note.mode)} rounded-full`}></div>
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">
            {note.aiEnhanced ? "AI Enhanced" : getModeLabel(note.mode)}
          </span>
        </div>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{timeAgo}</span>
      </div>
      
      <p className="text-base mb-3">{note.content}</p>
      
      {note.mode === "voice" && note.transcription && (
        <div className="flex items-center space-x-3 mb-3 p-3 bg-[hsl(var(--accent))] rounded-xl">
          <button className="w-8 h-8 rounded-full bg-[hsl(var(--ocean-blue))] flex items-center justify-center">
            <Play className="w-3 h-3 text-white ml-0.5" />
          </button>
          <div className="flex-1 flex items-center space-x-1">
            <div className="h-1 bg-[hsl(var(--ocean-blue))] rounded-full w-[30%]"></div>
            <div className="h-1 bg-[hsl(var(--border))] rounded-full w-[70%]"></div>
          </div>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">0:45</span>
        </div>
      )}
      
      {note.aiSuggestion && (
        <div className="bg-[hsl(var(--accent))] rounded-xl p-3 mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <Bot className="w-4 h-4 text-[hsl(var(--sea-green))]" />
            <span className="text-sm font-medium text-[hsl(var(--sea-green))]">AI Suggestion</span>
          </div>
          <p className="text-sm text-[hsl(var(--foreground))]">{note.aiSuggestion}</p>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {note.todos.length > 0 && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-[hsl(var(--sea-green))]" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                {note.todos.length} to-do{note.todos.length !== 1 ? "s" : ""} extracted
              </span>
            </div>
          )}
          
          {note.collection && (
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-[hsl(var(--coral-accent))]" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">{note.collection.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
