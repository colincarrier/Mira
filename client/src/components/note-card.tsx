import type { NoteWithTodos } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Play, Bot, CheckCircle, Folder, Share2, Star, Calendar, MapPin, Phone, ShoppingCart, Copy, Edit3, Archive } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

// Helper function to detect contextual actions based on note content
const getContextualActions = (content: string, todos: any[]) => {
  const actions = [];
  const lowerContent = content.toLowerCase();
  
  // Phone/contact related
  if (lowerContent.includes('call') || lowerContent.includes('phone') || lowerContent.includes('contact')) {
    actions.push({ icon: Phone, label: 'Call', color: 'soft-sky-blue' });
  }
  
  // Shopping/buying related
  if (lowerContent.includes('buy') || lowerContent.includes('shop') || lowerContent.includes('grocery') || lowerContent.includes('purchase')) {
    actions.push({ icon: ShoppingCart, label: 'Shop', color: 'seafoam-green' });
  }
  
  // Calendar/scheduling related
  if (lowerContent.includes('schedule') || lowerContent.includes('appointment') || lowerContent.includes('meeting') || lowerContent.includes('date')) {
    actions.push({ icon: Calendar, label: 'Schedule', color: 'dusty-teal' });
  }
  
  // Location related
  if (lowerContent.includes('address') || lowerContent.includes('location') || lowerContent.includes('place') || lowerContent.includes('restaurant')) {
    actions.push({ icon: MapPin, label: 'Navigate', color: 'pale-sage' });
  }
  
  // Always show copy action
  actions.push({ icon: Copy, label: 'Copy', color: 'stone-gray' });
  
  // Show share if there are todos or it's enhanced
  if (todos.length > 0) {
    actions.push({ icon: Share2, label: 'Share', color: 'soft-sky-blue' });
  }
  
  return actions.slice(0, 4); // Limit to 4 actions max
};

export default function NoteCard({ note }: NoteCardProps) {
  const timeAgo = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const contextualActions = getContextualActions(note.content, note.todos);
  
  const handleAction = (actionLabel: string) => {
    switch (actionLabel) {
      case 'Copy':
        navigator.clipboard.writeText(note.content);
        toast({
          title: "Copied to clipboard",
          description: "Note content has been copied.",
        });
        break;
      case 'Share':
        if (navigator.share) {
          navigator.share({
            title: 'Note from Mira',
            text: note.content,
          });
        } else {
          navigator.clipboard.writeText(note.content);
          toast({
            title: "Copied to clipboard",
            description: "Note content ready to share.",
          });
        }
        break;
      case 'Call':
        // Extract phone number if present, or show suggestion
        toast({
          title: "Call reminder",
          description: "Don't forget to make that call!",
        });
        break;
      case 'Shop':
        toast({
          title: "Shopping reminder",
          description: "Added to your mental shopping list!",
        });
        break;
      case 'Schedule':
        toast({
          title: "Schedule reminder",
          description: "Don't forget to book that appointment!",
        });
        break;
      case 'Navigate':
        toast({
          title: "Location noted",
          description: "Ready to help you get there!",
        });
        break;
    }
  };

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
      
      {/* Contextual Quick Actions */}
      {contextualActions.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t border-[hsl(var(--border))]">
          <div className="flex items-center space-x-2">
            {contextualActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action.label)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors bg-[hsl(var(--${action.color}))] text-[hsl(var(--foreground))] hover:opacity-80`}
              >
                <action.icon className="w-3 h-3" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-4">
          {note.todos.length > 0 && (
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-[hsl(var(--seafoam-green))]" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                {note.todos.length} to-do{note.todos.length !== 1 ? "s" : ""} extracted
              </span>
            </div>
          )}
          
          {note.collection && (
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-[hsl(var(--sand-taupe))]" />
              <span className="text-sm text-[hsl(var(--muted-foreground))]">{note.collection.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
