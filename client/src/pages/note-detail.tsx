import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, MessageSquare, CheckSquare, Folder, Share2, Edit3, Send, Bot } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { NoteWithTodos } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function NoteDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [showContextDialog, setShowContextDialog] = useState(false);
  
  const { data: note, isLoading } = useQuery<NoteWithTodos>({
    queryKey: ["/api/notes", id],
    enabled: !!id,
  });

  // Mutation to update note with AI enhancement
  const updateNoteMutation = useMutation({
    mutationFn: async ({ content, newContext }: { content: string; newContext?: string }) => {
      const response = await apiRequest("PATCH", `/api/notes/${id}`, {
        content,
        ...(newContext && { contextUpdate: newContext })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setIsEditing(false);
      setContextInput('');
      toast({
        description: "Note updated successfully!",
      });
    },
    onError: () => {
      toast({
        description: "Failed to update note",
        variant: "destructive",
      });
    },
  });

  // Initialize editing content when note loads
  useEffect(() => {
    if (note && !editedContent) {
      setEditedContent(note.content || '');
    }
  }, [note, editedContent]);

  // Auto-show context dialog for urgent questions
  useEffect(() => {
    if (note?.aiSuggestion?.includes('🚨') && !showContextDialog) {
      setShowContextDialog(true);
    }
  }, [note?.aiSuggestion, showContextDialog]);

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                if (!isEditing && note) {
                  setEditedContent(note.content || '');
                }
              }}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                isEditing ? 'bg-[hsl(var(--sage-green))] text-white' : 'bg-[hsl(var(--card))] border border-[hsl(var(--border))]'
              }`}
              title={isEditing ? "Stop editing" : "Edit note"}
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowContextDialog(!showContextDialog)}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                showContextDialog ? 'bg-[hsl(var(--sage-green))] text-white' : 'bg-[hsl(var(--card))] border border-[hsl(var(--border))]'
              }`}
              title="Add context"
            >
              <Bot className="w-4 h-4" />
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(var(--ocean-blue))] text-white"
              title="Share note"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Note Content */}
        <div className="note-card mb-6">
          <div className="space-y-4">
            {/* Main Content */}
            <div>
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[120px] p-3 border border-[hsl(var(--border))] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sage-green))] bg-[hsl(var(--background))]"
                  placeholder="Edit your note..."
                />
              ) : (
                <p className="text-[hsl(var(--foreground))] leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              )}
              
              {isEditing && (
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(note?.content || '');
                    }}
                    className="px-3 py-1 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      updateNoteMutation.mutate({ content: editedContent });
                    }}
                    disabled={updateNoteMutation.isPending}
                    className="px-3 py-1 text-sm bg-[hsl(var(--sage-green))] text-white rounded-md hover:bg-[hsl(var(--sage-green))]/90 disabled:opacity-50"
                  >
                    {updateNoteMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
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

        {/* Enhanced AI Analysis Section - Always show in detail view */}
        <div className="note-card mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[hsl(var(--sage-green))] rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-3 text-[hsl(var(--sage-green))]">from Mira:</h3>
              
              {/* AI Context */}
              {note.aiContext ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">Understanding & Context</h4>
                  <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {note.aiContext}
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">AI Analysis</h4>
                  <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                    I can help provide context and suggestions for this note. Use the context dialog below to add more information, and I'll enhance this note with intelligent insights.
                  </p>
                </div>
              )}
              
              {/* AI Suggestions */}
              {note.aiSuggestion ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">Thoughtful Insights & Next Steps</h4>
                  <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {note.aiSuggestion}
                  </p>
                </div>
              ) : (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">Smart Suggestions</h4>
                  <div className="bg-[hsl(var(--muted))] rounded-lg p-3">
                    <h5 className="text-sm font-medium mb-2">Consider these approaches:</h5>
                    <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                      {note.content?.toLowerCase().includes('restaurant') || note.content?.toLowerCase().includes('food') ? (
                        <>
                          <li>• Check recent reviews and current menu offerings</li>
                          <li>• Consider making a reservation if it's popular</li>
                          <li>• Note any dietary restrictions or preferences</li>
                        </>
                      ) : note.content?.toLowerCase().includes('book') || note.content?.toLowerCase().includes('read') ? (
                        <>
                          <li>• Check your local library or bookstore availability</li>
                          <li>• Consider audiobook version for multitasking</li>
                          <li>• Set a realistic reading timeline</li>
                        </>
                      ) : note.content?.toLowerCase().includes('appointment') || note.content?.toLowerCase().includes('meeting') ? (
                        <>
                          <li>• Confirm location and any required documents</li>
                          <li>• Set reminders 24 hours and 1 hour before</li>
                          <li>• Plan for travel time and potential delays</li>
                        </>
                      ) : (
                        <>
                          <li>• Break this down into smaller, manageable steps</li>
                          <li>• Consider any dependencies or prerequisites</li>
                          <li>• Set a realistic timeline for completion</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
              
              {/* Enhanced contextual suggestions */}
              <div className="bg-[#d9ded3] rounded-lg p-3">
                <h5 className="text-sm font-medium mb-2 text-[hsl(var(--sage-green))]">Helpful Resources:</h5>
                <div className="text-sm text-[hsl(var(--foreground))] space-y-1">
                  {note.content?.toLowerCase().includes('party') || note.content?.toLowerCase().includes('birthday') ? (
                    <p>🎉 Consider creating a shared planning document and setting up calendar reminders for key milestones.</p>
                  ) : note.content?.toLowerCase().includes('travel') || note.content?.toLowerCase().includes('trip') ? (
                    <p>✈️ Start a travel checklist covering bookings, documents, packing, and local research.</p>
                  ) : note.content?.toLowerCase().includes('project') || note.content?.toLowerCase().includes('work') ? (
                    <p>📋 Consider setting up a project timeline with key deliverables and stakeholder check-ins.</p>
                  ) : (
                    <p>💡 This might connect well with your other notes - consider organizing related items together.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

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

        {/* Persistent Context Dialog */}
        {showContextDialog && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-lg p-4 z-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[hsl(var(--sage-green))] rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-2 text-[hsl(var(--sage-green))]">Add Context</h4>
                {note?.aiSuggestion?.includes('🚨') && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">
                    Mira needs more information to help with urgent planning
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={contextInput}
                    onChange={(e) => setContextInput(e.target.value)}
                    placeholder="e.g., March 15th, or any additional details..."
                    className="flex-1 px-3 py-2 text-sm border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sage-green))] bg-[hsl(var(--background))]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (contextInput.trim()) {
                          updateNoteMutation.mutate({ 
                            content: editedContent || note?.content || '', 
                            newContext: contextInput 
                          });
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (contextInput.trim()) {
                        updateNoteMutation.mutate({ 
                          content: editedContent || note?.content || '', 
                          newContext: contextInput 
                        });
                      }
                    }}
                    disabled={updateNoteMutation.isPending || !contextInput.trim()}
                    className="px-3 py-2 bg-[hsl(var(--sage-green))] text-white rounded-md hover:bg-[hsl(var(--sage-green))]/90 disabled:opacity-50 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setShowContextDialog(false)}
                  className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mt-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}