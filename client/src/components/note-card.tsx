import { useState, useRef } from "react";
import type { NoteWithTodos } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { Play, Pause, CheckCircle, Folder, Share2, Star, Calendar, MapPin, Phone, ShoppingCart, Copy, Edit3, Archive, ChevronRight, ExternalLink, X, Check, ArrowUpRight, MoreHorizontal, Plus, Trash2, CheckCircle2, Loader2, Bell, Zap, ArrowRight, Info, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import AIProcessingIndicator from "@/components/ai-processing-indicator";
import MediaDisplay from "@/components/media-display";
import { ReminderDialog } from "@/components/reminder-dialog";

// Voice Note Player Component
interface VoiceNotePlayerProps {
  note: NoteWithTodos;
}

function VoiceNotePlayer({ note }: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayback = () => {
    if (!audioRef.current || !note.audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const generateWaveform = () => {
    const text = note.transcription || note.content;
    const chars = text.split('');
    return Array.from({ length: 24 }, (_, i) => {
      const charCode = chars[i % chars.length]?.charCodeAt(0) || 65;
      const amplitude = (charCode % 100) / 100 * 0.6 + 0.4;
      return amplitude;
    });
  };

  const waveformData = generateWaveform();
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-3 mb-3">
      {note.audioUrl && (
        <audio
          ref={audioRef}
          src={note.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}
      <button 
        onClick={togglePlayback}
        disabled={!note.audioUrl}
        className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-50"
      >
        {isPlaying ? (
          <Pause className="w-3 h-3 text-white" />
        ) : (
          <Play className="w-3 h-3 text-white ml-0.5" />
        )}
      </button>
      <div className="flex-1 h-6 flex items-end justify-start space-x-0.5">
        {waveformData.map((amplitude, i) => {
          const progress = duration > 0 ? currentTime / duration : 0;
          const isActive = i / waveformData.length <= progress;
          return (
            <div
              key={i}
              className={`w-0.5 rounded-full transition-colors ${
                isActive 
                  ? 'bg-gradient-to-t from-blue-700 to-blue-500' 
                  : 'bg-gradient-to-t from-blue-600 to-blue-400 opacity-70'
              }`}
              style={{
                height: `${Math.max(2, amplitude * 20)}px`
              }}
            />
          );
        })}
      </div>
      <span className="text-xs text-gray-600">
        {duration > 0 ? formatTime(duration) : (
          note.transcription 
            ? `${Math.ceil(note.transcription.length / 150)}s`
            : 'Voice note'
        )}
      </span>
    </div>
  );
}

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
    .replace(' day', 'd').replace(' weeks', 'w').replace(' week', 'w')
    .replace('less than a minute', 'less than a min')
    .replace('less than am', 'less than a min');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showTodosModal, setShowTodosModal] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);

  const followUpQuestions = getFollowUpQuestions(note.content, note.todos);

  // Helper to format content with proper title length limits
  const formatContent = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const bullets = lines.filter(line => line.trim().match(/^[-•*]\s+/));

    let firstLine = lines[0] || '';

    // Remove AI partner indicators from title
    firstLine = firstLine.replace(/^\[claude\]\s*/i, '').replace(/^\[openai\]\s*/i, '').replace(/^\[gpt\]\s*/i, '');

    const hasDescription = lines.length > 1 || bullets.length >= 2;

    // Title character limits: 1 line (~50 chars) with description, 3 lines (~150 chars) without
    const maxTitleLength = hasDescription ? 50 : 150;
    const title = firstLine.length > maxTitleLength 
      ? firstLine.substring(0, maxTitleLength).trim()
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
        description: description.length >= 120 ? description.trim() : description,
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

  // Detect AI partner used
  const getAIPartner = (content: string) => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('[claude]') || note.mode === 'enhanced') {
      return 'claude';
    }
    if (lowerContent.includes('[openai]') || lowerContent.includes('[gpt]')) {
      return 'openai';
    }
    return null;
  };

  const aiPartner = getAIPartner(note.content);

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
    setLocation(`/notes/${note.id}`);
  };

  // Mutation to delete note
  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/notes/${note.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        description: "Note deleted successfully!",
      });
    },
    onError: () => {
      toast({
        description: "Failed to delete note",
        variant: "destructive",
      });
    },
  });

  const handleDeleteNote = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      deleteNoteMutation.mutate();
    }
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

  // Parse rich context data
  const parseRichContext = (richContext: string | null) => {
    if (!richContext) return null;
    try {
      return JSON.parse(richContext);
    } catch {
      return null;
    }
  };

  const richContextData = parseRichContext(note.richContext);

  // Parse smart actions from aiSuggestion
  const parseSmartActions = (aiSuggestion: string | null) => {
    if (!aiSuggestion) return [];

    const actions = [];
    const suggestions = aiSuggestion.split(',').map(s => s.trim());

    for (const suggestion of suggestions) {
      if (suggestion.includes('Add to Calendar') || suggestion.includes('calendar')) {
        actions.push({ type: 'calendar', label: 'Add to Calendar', icon: Calendar });
      } else if (suggestion.includes('Share') || suggestion.includes('share')) {
        actions.push({ type: 'share', label: 'Share', icon: Share2 });
      } else if (suggestion.includes('Reminder') || suggestion.includes('reminder')) {
        actions.push({ type: 'reminder', label: 'Set Reminder', icon: Bell });
      }
    }

    return actions;
  };

  const smartActions = parseSmartActions(note.aiSuggestion);

  const handleSmartAction = (action: any, e: React.MouseEvent) => {
    e.stopPropagation();

    switch (action.type) {
      case 'calendar':
        // Create calendar event
        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(note.content)}&details=${encodeURIComponent(note.aiContext || '')}`;
        window.open(calendarUrl, '_blank');
        break;
      case 'share':
        handleShare(e);
        break;
      case 'reminder':
        // Set reminder logic
        toast({
          description: "Reminder functionality coming soon!",
        });
        break;
    }
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
    <div className="note-card animate-fadeIn cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-800 py-4 w-full" onClick={handleCardClick}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">{timeAgo}</span>
          <div className={`w-2 h-2 ${getModeColor(note.mode)} rounded-full`}></div>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="w-6 h-6 rounded-full bg-[#f9fafb] active:bg-[hsl(var(--accent))] flex items-center justify-center transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="text-xs text-gray-500">
                Note ID: #{note.id}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleShare}>
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Share Note
              </DropdownMenuItem>
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
              <DropdownMenuItem 
                className="text-red-600"
                onClick={handleDeleteNote}
                disabled={deleteNoteMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowReminderDialog(true);
            }}
            className="w-6 h-6 rounded-full bg-[hsl(var(--muted))] active:bg-[hsl(var(--accent))] flex items-center justify-center transition-colors"
            title="Set reminder"
          >
            <Clock className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
      </div>
      {/* Subtle processing indicator */}
      {note.isProcessing && (
        <div className="mb-2 flex items-center space-x-2 text-xs text-muted-foreground">
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          <span className="opacity-60">AI processing</span>
        </div>
      )}

      {/* Content with iOS Notes-style formatting */}
      <div className="mb-3">
        {/* Title - 1 line with description, 3 lines without */}
        <h3 className={`text-lg font-semibold leading-tight mb-1 text-[hsl(var(--foreground))] ${
          formattedContent.description || formattedContent.hasStructure ? 'line-clamp-1' : 'line-clamp-3'
        }`}>
          {note.todos && note.todos.length > 0 ? note.todos[0].title : 
           (note.aiSuggestion && !note.aiSuggestion.includes('You are Mira') && note.aiSuggestion.length < 100) ? 
           note.aiSuggestion : formattedContent.title}
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
        ) : note.aiContext ? (
          <p className="text-sm leading-tight text-[hsl(var(--muted-foreground))] line-clamp-2">
            {note.aiContext}
          </p>
        ) : formattedContent.description ? (
          <p className="text-sm leading-tight text-[hsl(var(--muted-foreground))] line-clamp-2">
            {formattedContent.description}
          </p>
        ) : null}
      </div>

      {/* Media Display */}
      {note.mediaUrl && (
        <MediaDisplay mediaUrl={note.mediaUrl} />
      )}

      {/* Enhanced Voice Note Display */}
      {note.mode === 'voice' && note.transcription && (
        <VoiceNotePlayer note={note} />
      )}


      {/* Next Steps from Rich Context */}
      {richContextData?.nextSteps && richContextData.nextSteps.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-1 mb-2">
            <ArrowRight className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Next Steps</span>
          </div>
          <div className="space-y-1">
            {richContextData.nextSteps.map((step: string, index: number) => (
              <div
                key={index}
                className="flex items-start space-x-2 text-xs p-2 bg-[#d9d5c7] rounded-md"
              >
                <Zap className="w-3 h-3 text-[hsl(var(--primary))] mt-0.5 flex-shrink-0" />
                <span className="text-[hsl(var(--foreground))]">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions with Links */}
      {richContextData?.recommendedActions && richContextData.recommendedActions.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-1 mb-2">
            <Info className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Suggestions</span>
          </div>
          <div className="space-y-2">
            {richContextData.recommendedActions.map((action: any, index: number) => (
              <div key={index} className="p-2 bg-[hsl(var(--muted))] rounded-md">
                <h4 className="text-xs font-medium text-[hsl(var(--foreground))] mb-1">{action.title}</h4>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{action.description}</p>
                {action.links && action.links.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {action.links.map((link: any, linkIndex: number) => (
                      <button
                        key={linkIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(link.url, '_blank');
                        }}
                        className="flex items-center space-x-1 px-2 py-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded text-xs hover:bg-[hsl(var(--primary))]/90 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>{link.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Insights */}
      {richContextData?.quickInsights && richContextData.quickInsights.length > 0 && (
        <div className="mb-3">
          <div className="space-y-1">
            {richContextData.quickInsights.map((insight: string, index: number) => (
              <div
                key={index}
                className="text-xs px-2 py-1 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] rounded-md italic"
              >
                💡 {insight}
              </div>
            ))}
          </div>
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
      <div className="flex items-center justify-between mt-3 relative">
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

        <div className="flex items-center gap-2">
          {/* AI Partner Logo - Aligned with text baseline */}
          {aiPartner && (
            <div className="flex items-center">
              {aiPartner === 'claude' && (
                <div className="h-3 opacity-[0.3] hover:opacity-40 transition-opacity" title="Enhanced by Claude Sonnet 4">
                  <img 
                    src="/claude-logo.png" 
                    alt="Claude" 
                    className="h-full w-auto object-contain"
                  />
                </div>
              )}
              {aiPartner === 'openai' && (
                <div className="w-3 h-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center opacity-[0.3] hover:opacity-40 transition-opacity" title="Enhanced by GPT-4o">
                  <span className="text-white text-[5px] font-bold">AI</span>
                </div>
              )}
            </div>
          )}

          {/* AI enhanced indicator moved to bottom right */}
          {!note.isProcessing && note.aiEnhanced && (
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <CheckCircle2 className="w-3 h-3" />
              <span className="opacity-25">AI enhanced</span>
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

      {/* Reminder Dialog */}
      <ReminderDialog
        open={showReminderDialog}
        onOpenChange={setShowReminderDialog}
        prePopulatedText={`Reminder: ${formattedContent.title}`}
        onReminderUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
          toast({
            description: "Reminder created successfully!",
          });
        }}
      />
    </div>
  );
}