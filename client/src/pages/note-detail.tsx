import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, MessageSquare, CheckSquare, Folder, Share2, Edit3, Send, Shell, Fish, Anchor, Ship, Eye, Brain, Sparkles, Zap, Gem, Circle, MoreHorizontal, Star, Archive, Trash2, Camera, Mic, Paperclip, Image, File, Copy, ArrowUpRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { NoteWithTodos } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


export default function NoteDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [updateInput, setUpdateInput] = useState('');
  const [showUpdateArea, setShowUpdateArea] = useState(true); // Always show floating chat bar
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: noteData, isLoading, error } = useQuery<NoteWithTodos>({
    queryKey: [`/api/notes/${id}`],
    enabled: !!id,
    refetchInterval: (data) => {
      // Auto-refresh every 2 seconds if AI hasn't enhanced the note yet
      const note = Array.isArray(data) ? data[0] : data;
      return note && !note.aiEnhanced ? 2000 : false;
    },
  });

  // Handle both single object and array responses
  const note = Array.isArray(noteData) ? noteData[0] : noteData;

  // Debug logging
  console.log('Note Detail Debug:', { id, noteData, note, isLoading, error });

  // Mutation to update note with AI enhancement
  const updateNoteMutation = useMutation({
    mutationFn: async ({ content, newContext, updateInstruction }: { content: string; newContext?: string; updateInstruction?: string }) => {
      const response = await apiRequest("PATCH", `/api/notes/${id}`, {
        content,
        ...(newContext && { contextUpdate: newContext }),
        ...(updateInstruction && { updateInstruction })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setIsEditing(false);
      setContextInput('');
      setUpdateInput('');
      setShowUpdateArea(false);
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

  // Mutation to delete note
  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setLocation("/");
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

  const handleDeleteNote = () => {
    console.log("Delete note clicked for note:", id);
    if (confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      console.log("User confirmed deletion, calling delete mutation");
      deleteNoteMutation.mutate();
    } else {
      console.log("User cancelled deletion");
    }
  };

  const handleUpdateNote = () => {
    if (!updateInput.trim() || !note) return;
    
    updateNoteMutation.mutate({
      content: note.content,
      updateInstruction: updateInput
    });
  };

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
        <div className="max-w-md mx-auto text-center py-12">
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
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Note Details</h1>
              {!note.aiEnhanced && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">AI processing...</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-6 h-6 rounded-md bg-[hsl(var(--muted))] active:bg-[hsl(var(--accent))] flex items-center justify-center transition-colors"
              title="Share note"
            >
              <ArrowUpRight className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-6 h-6 rounded-md bg-[hsl(var(--muted))] active:bg-[hsl(var(--accent))] flex items-center justify-center transition-colors"
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

        {/* AI Research Results - Google-style */}
        {note.richContext && (
          <div className="space-y-4">
            {(() => {
              try {
                const richData = JSON.parse(note.richContext);
                return (
                  <>
                    {/* Recommended Actions */}
                    {richData.recommendedActions && richData.recommendedActions.length > 0 && (
                      <div className="note-card">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">1</span>
                          </div>
                          <h3 className="font-medium text-[hsl(var(--foreground))]">Recommended Next Steps</h3>
                        </div>
                        <div className="space-y-2">
                          {richData.recommendedActions.map((action: any, index: number) => (
                            <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="font-medium text-sm text-blue-900 mb-1">{action.title}</div>
                              <div className="text-sm text-blue-800 mb-2">{action.description}</div>
                              {action.links && action.links.length > 0 && (
                                <div className="space-y-1">
                                  {action.links.map((link: any, linkIndex: number) => (
                                    <a 
                                      key={linkIndex} 
                                      href={link.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="block text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                      {link.title}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Research Results */}
                    {richData.researchResults && richData.researchResults.length > 0 && (
                      <div className="note-card">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">2</span>
                          </div>
                          <h3 className="font-medium text-[hsl(var(--foreground))]">Research & Options</h3>
                        </div>
                        <div className="space-y-3">
                          {richData.researchResults.map((result: any, index: number) => (
                            <div key={index} className="border border-[hsl(var(--border))] rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-sm">{result.title}</h4>
                                {result.rating && (
                                  <div className="text-xs text-yellow-600 flex items-center gap-1">
                                    <span>★</span>
                                    <span>{result.rating}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">{result.description}</p>
                              {result.keyPoints && (
                                <ul className="space-y-1 mb-2">
                                  {result.keyPoints.map((point: string, pointIndex: number) => (
                                    <li key={pointIndex} className="text-xs text-[hsl(var(--muted-foreground))] flex items-start gap-1">
                                      <span className="text-green-500">•</span>
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {result.contact && (
                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                  Contact: {result.contact}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Insights */}
                    {richData.quickInsights && richData.quickInsights.length > 0 && (
                      <div className="note-card">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">3</span>
                          </div>
                          <h3 className="font-medium text-[hsl(var(--foreground))]">Key Considerations</h3>
                        </div>
                        <div className="grid gap-2">
                          {richData.quickInsights.map((insight: string, index: number) => (
                            <div key={index} className="text-sm p-2 bg-purple-50 border-l-2 border-purple-400 rounded-r">
                              {insight}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              } catch (e) {
                return null;
              }
            })()}
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

        {/* Floating Chat Bubble */}
        {showUpdateArea && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <div className="max-w-md mx-auto">
              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl shadow-lg overflow-hidden min-h-[60px]">
                <div className="flex items-center h-full px-2 py-2 bg-[#ffffffdb]">
                  {/* Add Media Button */}
                  <button
                    onClick={() => {
                      toast({ description: "Media capture coming soon!" });
                    }}
                    className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[hsl(var(--dusty-teal))] transition-colors flex-shrink-0 bg-[#f1efe8]"
                    title="Add media"
                  >
                    <span className="text-[#7d7d7d] text-[30px] font-light">+</span>
                  </button>
                  
                  {/* Text Input */}
                  <textarea
                    value={updateInput}
                    onChange={(e) => setUpdateInput(e.target.value)}
                    placeholder="update anything here..."
                    className="flex-1 min-h-[44px] max-h-[120px] px-3 py-3 text-sm resize-none focus:outline-none bg-transparent"
                    style={{ lineHeight: '1.4' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && updateInput.trim()) {
                        e.preventDefault();
                        handleUpdateNote();
                      }
                    }}
                  />
                  
                  {/* Right side buttons */}
                  <div className="flex items-center pr-1">
                    <button
                      onClick={() => {
                        toast({ description: "Voice recording coming soon!" });
                      }}
                      className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[hsl(var(--dusty-teal))] transition-colors bg-[#a2cddc]"
                      title="Voice note"
                    >
                      <Mic className="w-5 h-5 text-white" />
                    </button>
                    
                    {/* Send Button - only show when there's content */}
                    {updateInput.trim() && (
                      <button
                        onClick={handleUpdateNote}
                        disabled={updateNoteMutation.isPending}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(var(--sage-green))] text-white hover:bg-[hsl(var(--sage-green))]/90 disabled:opacity-50 transition-all ml-1"
                        title="Send update"
                      >
                        {updateNoteMutation.isPending ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast({ description: `File "${file.name}" selected. Upload functionality coming soon!` });
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Context Dialog (kept for backward compatibility) */}
        {showContextDialog && (
          <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl shadow-lg p-4 z-50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[hsl(var(--sage-green))] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold italic text-sm">M</span>
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