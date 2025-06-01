import { useState } from "react";
import type { NoteWithTodos } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Play, Bot, CheckCircle, Folder, Share2, Star, Calendar, MapPin, Phone, ShoppingCart, Copy, Edit3, Archive, ChevronRight, ExternalLink, X, Check, ArrowUpRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

// Helper function to generate intelligent follow-up questions
const getFollowUpQuestions = (content: string, todos: any[]) => {
  const questions = [];
  const lowerContent = content.toLowerCase();
  
  // Restaurant/food related
  if (lowerContent.includes('restaurant') || lowerContent.includes('food') || lowerContent.includes('dinner') || lowerContent.includes('lunch')) {
    questions.push("What's the price range?");
    questions.push("Any dietary restrictions to note?");
    questions.push("What's the atmosphere like?");
  }
  
  // Book/movie related
  else if (lowerContent.includes('book') || lowerContent.includes('read') || lowerContent.includes('movie') || lowerContent.includes('watch')) {
    questions.push("What genre is this?");
    questions.push("Who recommended this?");
    questions.push("When do you want to finish it?");
  }
  
  // Travel/location related
  else if (lowerContent.includes('travel') || lowerContent.includes('trip') || lowerContent.includes('vacation') || lowerContent.includes('visit')) {
    questions.push("What's your budget range?");
    questions.push("Best time of year to visit?");
    questions.push("How many days needed?");
  }
  
  // School/education related
  else if (lowerContent.includes('school') || lowerContent.includes('preschool') || lowerContent.includes('teacher') || lowerContent.includes('education')) {
    questions.push("What are the enrollment requirements?");
    questions.push("What's the student-teacher ratio?");
    questions.push("Are there waiting lists?");
  }
  
  // Shopping/purchase related
  else if (lowerContent.includes('buy') || lowerContent.includes('purchase') || lowerContent.includes('shop')) {
    questions.push("What's your budget limit?");
    questions.push("Where can you find the best price?");
    questions.push("When do you need this by?");
  }
  
  // Appointment/scheduling related
  else if (lowerContent.includes('appointment') || lowerContent.includes('schedule') || lowerContent.includes('meeting')) {
    questions.push("What documents do you need?");
    questions.push("How long will this take?");
    questions.push("Any prep work required?");
  }
  
  // General fallback questions
  else {
    questions.push("What's the next step?");
    questions.push("Who else should know about this?");
    questions.push("When is the deadline?");
  }
  
  return questions.slice(0, 3); // Limit to 3 questions max
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

  // Helper to format content with bullet points
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    const bullets = lines.filter(line => line.trim().match(/^[-•*]\s+/));
    
    if (bullets.length >= 2) {
      // Show first line + first few bullets
      const firstLine = lines.find(line => !line.trim().match(/^[-•*]\s+/) && line.trim().length > 0);
      const displayBullets = bullets.slice(0, 3).map(b => b.replace(/^[-•*]\s+/, '').trim());
      
      return {
        hasStructure: true,
        firstLine: firstLine || '',
        bullets: displayBullets
      };
    }
    
    return {
      hasStructure: false,
      content: content,
      firstLine: '',
      bullets: []
    };
  };

  const formattedContent = formatContent(note.content);

  const handleCardClick = () => {
    setLocation(`/note/${note.id}`);
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
          <ChevronRight className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        </div>
      </div>
      
      {/* Content with smart formatting */}
      <div className="text-base mb-3">
        {formattedContent.hasStructure ? (
          <div>
            {formattedContent.firstLine && (
              <p className="mb-2">{formattedContent.firstLine}</p>
            )}
            <ul className="space-y-1">
              {formattedContent.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="text-[hsl(var(--muted-foreground))] mr-2 mt-1.5 flex-shrink-0">•</span>
                  <span className="line-clamp-1">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="line-clamp-3">{formattedContent.content}</p>
        )}
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
        <div className="rounded-xl p-3 mb-3 bg-[#d9ded3]">
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
          {note.todos.length > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowTodosModal(true);
              }}
              className="flex items-center space-x-2 hover:bg-[hsl(var(--muted))] rounded p-1 -m-1 transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-[hsl(var(--seafoam-green))]" />
              <span className="text-[hsl(var(--muted-foreground))] text-[12px]">
                {note.todos.length} to-do{note.todos.length !== 1 ? "s" : ""}
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
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  todo.completed 
                    ? 'bg-[hsl(var(--seafoam-green))] border-[hsl(var(--seafoam-green))]'
                    : 'border-[hsl(var(--muted-foreground))]'
                }`}>
                  {todo.completed && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
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
