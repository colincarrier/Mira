import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, MessageSquare, CheckSquare, Folder, Share2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { NoteWithTodos } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function NoteDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { data: note, isLoading } = useQuery<NoteWithTodos>({
    queryKey: ["/api/notes", id],
    enabled: !!id,
  });

  const handleShare = () => {
    if (!note) return;
    
    const shareText = formatNoteForSharing(note);
    
    if (navigator.share) {
      navigator.share({
        title: `Note from ${note.createdAt ? formatDistanceToNow(new Date(note.createdAt), { addSuffix: true }) : 'recently'}`,
        text: shareText,
      }).catch(console.error);
    } else {
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
      note.todos.forEach((todo) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] p-4">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-xl font-semibold mb-2">Note not found</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            The note you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="text-[hsl(var(--ios-blue))] font-medium"
          >
            Go back to notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg font-semibold">Note Details</h1>
          </div>
          <button
            onClick={handleShare}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(var(--ocean-blue))] text-white"
            title="Share note"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Note Content */}
        <div className="note-card mb-6">
          <div className="space-y-4">
            {/* Main Content */}
            <div>
              <p className="text-[hsl(var(--foreground))] leading-relaxed">
                {note.content}
              </p>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))] pt-3 border-t border-[hsl(var(--border))]">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{note.createdAt ? format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a") : 'Unknown date'}</span>
              </div>
              {note.mode && (
                <div className="flex items-center gap-1">
                  <span className="capitalize">{note.mode} note</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Context */}
        {note.aiContext && (
          <div className="note-card mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[hsl(var(--sage-green))] rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-2">Context & Background</h3>
                <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {note.aiContext}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestion */}
        {note.aiSuggestion && (
          <div className="note-card mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[hsl(var(--ocean-blue))] rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-2">Follow-up Question</h3>
                <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {note.aiSuggestion}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Todos */}
        {note.todos && note.todos.length > 0 && (
          <div className="note-card mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[hsl(var(--coral-accent))] rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckSquare className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium mb-3">Action Items</h3>
                <div className="space-y-2">
                  {note.todos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        todo.completed 
                          ? 'bg-[hsl(var(--sage-green))] border-[hsl(var(--sage-green))]' 
                          : 'border-[hsl(var(--border))]'
                      }`}>
                        {todo.completed && (
                          <CheckSquare className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className={`flex-1 ${
                        todo.completed ? 'line-through text-[hsl(var(--muted-foreground))]' : ''
                      }`}>
                        {todo.title}
                      </span>
                      {todo.priority === 'urgent' && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Urgent
                        </span>
                      )}
                      {todo.pinned && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          Pinned
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collection */}
        {note.collection && (
          <div className="note-card">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[hsl(var(--soft-gray))] rounded-lg flex items-center justify-center">
                <Folder className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium">Collection</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {note.collection.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}