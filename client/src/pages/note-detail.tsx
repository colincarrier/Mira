import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, MessageSquare, CheckSquare, Folder, Share2, Edit3, Send, Shell, Fish, Anchor, Ship, Eye, Brain, Sparkles, Zap, Gem, Circle, MoreHorizontal, Star, Archive, Trash2, Camera, Mic, Paperclip, Image, File, Copy, ArrowUpRight, Plus } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { NoteWithTodos, Todo } from "@shared/schema";
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
  const [showUpdateArea, setShowUpdateArea] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddButtonHidden, setIsAddButtonHidden] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  
  const { data: noteData, isLoading, error } = useQuery<NoteWithTodos>({
    queryKey: [`/api/notes/${id}`],
    enabled: !!id,
    refetchInterval: (data) => {
      const note = Array.isArray(data) ? data[0] : data;
      return note && !note.aiEnhanced ? 2000 : false;
    },
  });

  const note = Array.isArray(noteData) ? noteData[0] : noteData;

  // Mutations
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
      toast({ title: "Note updated successfully" });
      setIsEditing(false);
      setShowContextDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to update note", variant: "destructive" });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/notes/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Note deleted successfully" });
      setLocation("/");
    },
    onError: () => {
      toast({ title: "Failed to delete note", variant: "destructive" });
    }
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async (todo: Todo) => {
      await apiRequest("PATCH", `/api/todos/${todo.id}`, {
        completed: !todo.completed
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${id}`] });
    }
  });

  const evolveNoteMutation = useMutation({
    mutationFn: async (evolutionInstruction: string) => {
      const response = await apiRequest("POST", `/api/notes/${id}/evolve`, {
        instruction: evolutionInstruction,
        existingContent: note?.content,
        existingContext: note?.aiContext,
        existingTodos: note?.todos,
        existingRichContext: note?.richContext,
        noteId: id
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${id}`] });
      toast({ title: "Note evolved successfully" });
      setUpdateInput('');
      setShowUpdateArea(false);
    },
    onError: () => {
      toast({ title: "Failed to evolve note", variant: "destructive" });
    }
  });

  useEffect(() => {
    if (note) {
      setEditedContent(note.content);
    }
  }, [note]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mira Note',
          text: formatNoteForSharing(note),
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(formatNoteForSharing(note));
      toast({ title: "Note copied to clipboard" });
    }
  };

  const handleDeleteNote = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate();
    }
  };

  const formatNoteForSharing = (note: NoteWithTodos) => {
    let shareText = `📝 ${note.content}\n\n`;
    
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

  // Enhanced content rendering with rich media
  const renderEnhancedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      const imageRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s]*)?/gi;
      const videoRegex = /https?:\/\/[^\s]+\.(mp4|webm|mov|avi|mkv)(\?[^\s]*)?/gi;
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/gi;
      
      if (imageRegex.test(line)) {
        const imageUrls = line.match(imageRegex);
        imageUrls?.forEach((url, imgIndex) => {
          elements.push(
            <div key={`${index}-img-${imgIndex}`} className="my-3">
              <img 
                src={url} 
                alt="Inline image" 
                className="w-full rounded-lg border border-[hsl(var(--border))] max-h-80 object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          );
        });
      } else if (videoRegex.test(line)) {
        const videoUrls = line.match(videoRegex);
        videoUrls?.forEach((url, vidIndex) => {
          elements.push(
            <div key={`${index}-vid-${vidIndex}`} className="my-3">
              <video 
                src={url} 
                controls 
                className="w-full rounded-lg border border-[hsl(var(--border))] max-h-80"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );
        });
      } else if (youtubeRegex.test(line)) {
        let match;
        let ytIndex = 0;
        youtubeRegex.lastIndex = 0;
        while ((match = youtubeRegex.exec(line)) !== null) {
          const videoId = match[1];
          elements.push(
            <div key={`${index}-yt-${ytIndex}`} className="my-3">
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          );
          ytIndex++;
        }
      } else if (line.trim()) {
        elements.push(
          <p key={`${index}-text`} className="mb-2 leading-relaxed">
            {line}
          </p>
        );
      }
    });
    
    return elements;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
        <div className="flex items-center gap-3 p-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="px-4 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
        <div className="text-center py-12 px-4">
          <h1 className="text-xl font-semibold mb-2">Note not found</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-4">
            This note may have been deleted or moved.
          </p>
          <button
            onClick={() => setLocation("/")}
            className="px-4 py-2 bg-[hsl(var(--sage-green))] text-white rounded-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] pb-24">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[#f5f5f5]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--border))]"
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
        <div className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
          <div className="px-4 py-6 space-y-4">
            <div>
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full min-h-[120px] p-3 border border-[hsl(var(--border))] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sage-green))] bg-[hsl(var(--background))]"
                  placeholder="Edit your note..."
                />
              ) : (
                <div className="text-[hsl(var(--foreground))] leading-relaxed">
                  {renderEnhancedContent(note.content)}
                </div>
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
                  {note.mode === 'standard' && <MessageSquare className="w-4 h-4" aria-label="Text input" />}
                  {note.mode === 'voice' && <Mic className="w-4 h-4" aria-label="Voice input" />}
                  {note.mode === 'camera' && <Camera className="w-4 h-4" aria-label="Camera input" />}
                  {note.mode === 'file' && <File className="w-4 h-4" aria-label="File upload" />}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Research Results */}
        {note.richContext && (
          <div className="space-y-0">
            {(() => {
              try {
                const richData = JSON.parse(note.richContext);
                return (
                  <>
                    {/* Recommended Actions */}
                    {richData.recommendedActions && richData.recommendedActions.length > 0 && (
                      <div className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
                        <div className="px-4 py-6">
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
                      </div>
                    )}

                    {/* Research Results */}
                    {richData.researchResults && richData.researchResults.length > 0 && (
                      <div className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
                        <div className="px-4 py-6">
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
                      </div>
                    )}

                    {/* Quick Insights */}
                    {richData.quickInsights && richData.quickInsights.length > 0 && (
                      <div className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
                        <div className="px-4 py-6">
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
          <div className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
            <div className="px-4 py-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[hsl(var(--coral-accent))] rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-3">Action Items</h3>
                  <div className="space-y-2">
                    {note.todos.map((todo: Todo) => (
                      <div key={todo.id} className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTodoMutation.mutate(todo)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            todo.completed 
                              ? 'bg-[hsl(var(--sage-green))] border-[hsl(var(--sage-green))]' 
                              : 'border-[hsl(var(--border))]'
                          }`}
                        >
                          {todo.completed && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </button>
                        <span className={`text-sm ${todo.completed ? 'line-through text-[hsl(var(--muted-foreground))]' : ''}`}>
                          {todo.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update/Evolution Area */}
        {showUpdateArea && (
          <div className="bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] px-4 py-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-[hsl(var(--sage-green))]" />
                <h3 className="font-medium text-[hsl(var(--foreground))]">Evolve This Note</h3>
              </div>
              
              <textarea
                value={updateInput}
                onChange={(e) => setUpdateInput(e.target.value)}
                placeholder="Tell me how to improve, update, or evolve this note... 

Examples:
• Add more todos based on what I wrote
• Check off completed items and suggest next steps  
• Research this topic and add relevant details
• Turn this into a proper action plan
• Add missing information or clarify unclear parts
• React to any links or info mentioned and suggest follow-ups"
                className="w-full min-h-[120px] p-3 border border-[hsl(var(--border))] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--sage-green))] bg-[hsl(var(--background))] text-sm"
              />
              
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowUpdateArea(false);
                    setUpdateInput('');
                  }}
                  className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  Cancel
                </button>
                
                <button
                  onClick={() => {
                    if (updateInput.trim()) {
                      evolveNoteMutation.mutate(updateInput.trim());
                    }
                  }}
                  disabled={!updateInput.trim() || evolveNoteMutation.isPending}
                  className="px-4 py-2 bg-[hsl(var(--sage-green))] text-white rounded-lg hover:bg-[hsl(var(--sage-green))]/90 disabled:opacity-50 text-sm font-medium"
                >
                  {evolveNoteMutation.isPending ? 'Evolving...' : 'Evolve Note'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar - Same style as other pages */}
      <div 
        className="fixed bottom-24 left-4 right-4 transition-transform duration-300 translate-x-0 opacity-100"
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          bottom: '6rem',
          left: '1rem',
          right: '1rem'
        }}
      >
        <div className="border border-gray-300 rounded-full px-4 py-3 shadow-lg flex items-center gap-3 bg-white">
          <input
            type="text"
            placeholder="Add/edit anything..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 text-gray-900"
          />
          <button 
            onClick={() => setShowUpdateArea(true)}
            className="w-8 h-8 bg-[#a8bfa1] hover:bg-green-700 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowUpdateArea(true)}
            className="w-8 h-8 bg-[#9bb8d3] hover:bg-blue-600 text-gray-700 rounded-full flex items-center justify-center transition-colors"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowUpdateArea(true)}
            className="w-8 h-8 bg-[#a1c4cfcc] hover:bg-blue-600 text-gray-700 rounded-full flex items-center justify-center transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}