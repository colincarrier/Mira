import { useState } from "react";
import type { NoteWithTodos } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Play, Bot, CheckCircle, Folder, Share2, Star, Calendar, MapPin, Phone, ShoppingCart, Copy, Edit3, Archive, ChevronRight, ExternalLink, X, Check, ArrowUpRight, MoreHorizontal, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface NoteCardProps {
  note: NoteWithTodos;
  onTodoModalClose?: () => void;
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

// Helper function to generate intelligent follow-up questions with time-sensitivity detection
const getFollowUpQuestions = (content: string, todos: any[]) => {
  const questions = [];
  const lowerContent = content.toLowerCase();
  
  // Check for time-sensitive events first
  const timeSensitiveTerms = [
    'birthday', 'party', 'anniversary', 'wedding', 'graduation', 'deadline',
    'appointment', 'meeting', 'interview', 'flight', 'reservation', 'event',
    'surprise', 'gift', 'holiday', 'vacation', 'trip'
  ];
  
  const hasTimeSensitive = timeSensitiveTerms.some(term => lowerContent.includes(term));
  
  if (hasTimeSensitive) {
    // For time-sensitive items, prioritize date/timing questions
    if (lowerContent.includes('party') || lowerContent.includes('surprise') || lowerContent.includes('birthday')) {
      questions.push("🚨 When is this happening? (Date needed for planning)");
      questions.push("Who else needs to know about this?");
      return questions;
    }
    if (lowerContent.includes('appointment') || lowerContent.includes('meeting') || lowerContent.includes('interview')) {
      questions.push("🚨 What's the exact date and time?");
      questions.push("Where is this taking place?");
      return questions;
    }
    if (lowerContent.includes('flight') || lowerContent.includes('trip') || lowerContent.includes('vacation')) {
      questions.push("🚨 What are your travel dates?");
      questions.push("Have you booked accommodations?");
      return questions;
    }
  }
  
  // For non-time-sensitive items, be more helpful and less annoying
  
  // Simple tasks that don't need AI overkill
  const simpleTaskPatterns = [
    /pick up .+ at \d+/,
    /buy .+/,
    /call .+/,
    /email .+/,
    /text .+/
  ];
  
  if (simpleTaskPatterns.some(pattern => pattern.test(lowerContent))) {
    // Don't add follow-up questions for obvious simple tasks
    return [];
  }
  
  // Restaurant/food related - focus on helpful info
  if (lowerContent.includes('restaurant') || lowerContent.includes('food')) {
    questions.push("What type of cuisine or atmosphere?");
    questions.push("Price range preference?");
  }
  
  // Book/movie/entertainment - focus on preferences
  else if (lowerContent.includes('book') || lowerContent.includes('movie') || lowerContent.includes('show')) {
    questions.push("What genre interests you?");
    questions.push("Any specific recommendations?");
  }
  
  // Only return questions if they add real value
  return questions.slice(0, 2);
};

export default function NoteCard({ note, onTodoModalClose }: NoteCardProps) {
  const timeAgo = formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })
    .replace('about ', '').replace(' hours', 'h').replace(' hour', 'h')
    .replace(' minutes', 'm').replace(' minute', 'm').replace(' days', 'd')
    .replace(' day', 'd').replace(' weeks', 'w').replace(' week', 'w');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showTodosModal, setShowTodosModal] = useState(false);
  
  const followUpQuestions = getFollowUpQuestions(note.content, note.todos);

  // Helper to format content with better title/description separation
  const formatContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const bullets = lines.filter(line => line.trim().match(/^[-•*]\s+/));
    
    // Extract a meaningful title (first 50 chars or first sentence)
    const firstLine = lines[0] || '';
    const title = firstLine.length > 50 
      ? firstLine.substring(0, 47) + '...'
      : firstLine;
    
    if (bullets.length >= 2) {
      const displayBullets = bullets.slice(0, 3).map(b => b.replace(/^[-•*]\s+/, '').trim());
      return {
        hasStructure: true,
        title,
        description: '',
        bullets: displayBullets
      };
    }
    
    // For longer content, split into title and description
    if (lines.length > 1) {
      const description = lines.slice(1).join(' ').substring(0, 120);
      return {
        hasStructure: false,
        title,
        description: description + (description.length >= 120 ? '...' : ''),
        bullets: []
      };
    }
    
    return {
      hasStructure: false,
      title,
      description: '',
      bullets: []
    };
  };

  const formattedContent = formatContent(note.content);

  // Calculate todo progress
  const todoProgress = () => {
    if (note.todos.length === 0) return null;
    
    const completed = note.todos.filter(todo => todo.completed).length;
    const total = note.todos.length;
    const percentage = (completed / total) * 100;
    
    let color = '';
    let icon = CheckCircle;
    
    if (percentage === 100) {
      color = 'text-green-600 bg-green-50';
      icon = CheckCircle2;
    } else if (percentage >= 51) {
      color = 'text-yellow-600 bg-yellow-50';
    } else {
      color = 'text-red-600 bg-red-50';
    }
    
    return {
      completed,
      total,
      percentage,
      color,
      icon
    };
  };

  const progress = todoProgress();

  const handleCardClick = () => {
    setLocation(`/note/${note.id}`);
  };

  const toggleTodoMutation = useMutation({
    mutationFn: async ({ todoId, completed }: { todoId: number; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/todos/${todoId}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const handleTodoToggle = (todo: any) => {
    toggleTodoMutation.mutate({ 
      todoId: todo.id, 
      completed: !todo.completed 
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    const shareText = formatNoteForSharing(note);
    
    if (navigator.share) {
      navigator.share({
        title: `Note from ${formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}`,
        text: shareText,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        toast({
          description: "Note copied to clipboard!",
        });
      }).catch(() => {
        toast({
          description: "Failed to copy note",
          variant: "destructive",
        });
      });
    }
  };

  const formatNoteForSharing = (note: NoteWithTodos) => {
    let shareText = `📝 Note from ${formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}\n\n`;
    
    shareText += `${note.content}\n\n`;
    
    if (note.aiContext) {
      shareText += `💡 Context:\n${note.aiContext}\n\n`;
    }
    
    if (note.aiSuggestion) {
      shareText += `🤔 Follow-up:\n${note.aiSuggestion}\n\n`;
    }
    
    if (note.todos && note.todos.length > 0) {
      shareText += `✅ Action Items:\n`;
      note.todos.forEach((todo, index) => {
        const status = todo.completed ? '✓' : '○';
        shareText += `${status} ${todo.title}\n`;
      });
      shareText += '\n';
    }
    
    if (note.collection) {
      shareText += `📁 Collection: ${note.collection.name}\n\n`;
    }
    
    shareText += `Shared from Mira`;
    
    return shareText;
  };

  return (
    <div className="note-card animate-fadeIn cursor-pointer hover:shadow-md transition-shadow bg-[#99917712]" onClick={handleCardClick}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{timeAgo}</span>
          <div className={`w-2 h-2 ${getModeColor(note.mode)} rounded-full`}></div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="w-6 h-6 rounded-full bg-[hsl(var(--muted))] active:bg-[hsl(var(--accent))] flex items-center justify-center transition-colors"
            title="Share note"
          >
            <ArrowUpRight className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
          </button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-6 h-6 rounded-full bg-[hsl(var(--muted))] active:bg-[hsl(var(--accent))] flex items-center justify-center transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Star className="w-4 h-4 mr-2" />
                Star Note
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="w-4 h-4 mr-2" />
                Add to Collection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Content with iOS Notes-style formatting */}
      <div className="mb-3">
        {/* Title - bigger and bolder like iOS Notes */}
        <h3 className="text-lg font-semibold leading-tight mb-1 text-[hsl(var(--foreground))]">
          {formattedContent.title}
        </h3>
        
        {/* Description or bullets - smaller, single-spaced */}
        {formattedContent.hasStructure ? (
          <ul className="space-y-0.5 text-sm leading-tight text-[hsl(var(--muted-foreground))]">
            {formattedContent.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start">
                <span className="mr-2 mt-0.5 flex-shrink-0">•</span>
                <span className="line-clamp-1">{bullet}</span>
              </li>
            ))}
          </ul>
        ) : formattedContent.description ? (
          <p className="text-sm leading-tight text-[hsl(var(--muted-foreground))] line-clamp-2">
            {formattedContent.description}
          </p>
        ) : null}
      </div>
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
        <div className="rounded-xl p-3 mb-3 bg-[#f6f7f282]">
          <div className="flex items-center space-x-2 mb-1">
            <Bot className="w-4 h-4 text-[hsl(var(--sea-green))]" />
            <span className="text-sm font-medium text-[hsl(var(--sea-green))]">from Mira:</span>
          </div>
          <p className="text-sm text-[hsl(var(--foreground))]">{note.aiSuggestion}</p>
        </div>
      )}
      {/* Follow-up Questions */}
      {followUpQuestions.length > 0 && (
        <div className="pt-3 border-t border-[hsl(var(--border))]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2">Follow-up questions:</p>
            {followUpQuestions.map((question, index) => (
              <div
                key={index}
                className="text-xs px-2 py-1 bg-[hsl(var(--muted))] rounded-md text-[#4f453b]"
              >
                {question}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-4 text-[12px]">
          {progress && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowTodosModal(true);
              }}
              className="flex items-center space-x-2 hover:bg-[hsl(var(--muted))] rounded p-1 -m-1 transition-colors"
            >
              <progress.icon className={`w-4 h-4 ${progress.color.split(' ')[0]}`} />
              <span className={`text-[12px] px-2 py-1 rounded-full ${progress.color}`}>
                {progress.completed}/{progress.total} to-do{progress.total !== 1 ? "s" : ""}
              </span>
            </button>
          )}
          
          {note.collection && (
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-[hsl(var(--sand-taupe))]" />
              <span className="text-[hsl(var(--muted-foreground))] text-[12px]">{note.collection.name}</span>
            </div>
          )}
        </div>
      </div>
      {/* Todos Modal */}
      <Dialog open={showTodosModal} onOpenChange={(open) => {
        setShowTodosModal(open);
        if (!open && onTodoModalClose) {
          onTodoModalClose();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>To-Dos from this note</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {note.todos.map((todo, index) => (
              <div key={index} className="flex items-start space-x-3 p-2 bg-[hsl(var(--muted))] rounded-lg">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTodoToggle(todo);
                  }}
                  disabled={toggleTodoMutation.isPending}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 cursor-pointer hover:scale-110 transition-transform ${
                    todo.completed 
                      ? 'bg-[hsl(var(--seafoam-green))] border-[hsl(var(--seafoam-green))]'
                      : 'border-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--seafoam-green))]'
                  }`}
                >
                  {todo.completed && <Check className="w-2.5 h-2.5 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${
                    todo.completed 
                      ? 'line-through text-[hsl(var(--muted-foreground))]' 
                      : 'text-[hsl(var(--foreground))]'
                  }`}>
                    {todo.title}
                  </p>
                  {todo.priority === 'urgent' && (
                    <span className="text-xs text-[#8B2635] font-medium">Urgent</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
