import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, MessageSquare, CheckSquare, Folder, Share2, Edit3, Send, Shell, Fish, Anchor, Ship, Eye, Brain, Sparkles, Zap, Gem, Circle, MoreHorizontal, Star, Archive, Trash2, Camera, Mic, Paperclip, Image, File, Copy, ArrowUpRight, Plus, Bell, Calendar, ExternalLink, Info, ArrowRight, Undo2, AlertTriangle, CheckCircle, X } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { NoteWithTodos, Todo } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { createCalendarEventFromContent, addToGoogleCalendar } from "@/lib/calendarUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AIProcessingIndicator from "@/components/ai-processing-indicator";
import MediaDisplay from "@/components/media-display";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function NoteDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [showContextDialog, setShowContextDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);
  const [clarificationInput, setClarificationInput] = useState('');

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Get version history
  const { data: versionHistory } = useQuery({
    queryKey: [`/api/notes/${id}/versions`],
    enabled: !!id && showVersionHistory,
  });

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

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: async (targetVersion: number) => {
      const response = await apiRequest("POST", `/api/notes/${id}/rollback`, { targetVersion });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${id}`] });
      setShowVersionHistory(false);
      toast({
        title: "Rollback Successful",
        description: "Note has been restored to the previous version",
      });
    },
    onError: () => {
      toast({
        title: "Rollback Failed",
        description: "Could not restore previous version",
        variant: "destructive"
      });
    }
  });

  // Approve changes mutation
  const approveChangesMutation = useMutation({
    mutationFn: async ({ suggestedChanges, userApproved }: { suggestedChanges: string; userApproved: boolean }) => {
      const response = await apiRequest("POST", `/api/notes/${id}/approve-changes`, { suggestedChanges, userApproved });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${id}`] });
      setShowApprovalDialog(false);
      setPendingChanges(null);
      toast({
        title: "Changes Applied",
        description: "AI suggestions have been applied to your note",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not apply changes",
        variant: "destructive"
      });
    }
  });

  // Clarification mutation  
  const clarifyMutation = useMutation({
    mutationFn: async ({ originalInstruction, clarification }: { originalInstruction: string; clarification: string }) => {
      const response = await apiRequest("POST", `/api/notes/${id}/clarify`, { originalInstruction, clarification });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${id}`] });
      setClarificationInput('');
      toast({
        title: "Clarification Applied",
        description: "AI has updated the note based on your clarification",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not apply clarification",
        variant: "destructive"
      });
    }
  });



  useEffect(() => {
    if (note) {
      setEditedContent(note.content);
      setEditedTitle(note.content.split('\n')[0] || 'Untitled Note');
    }
  }, [note]);

  // Auto-resize textarea when content changes
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }, [editedContent]);

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
    setIsTyping(true);
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsTyping(value.length > 0);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      console.log("Sending message for note update:", inputValue);
      
      // Create context-aware update with full note context
      const fullContext = {
        currentContent: note.content,
        todos: note.todos || [],
        richContext: note.richContext,
        aiContext: note.aiContext,
        userModification: inputValue.trim()
      };
      
      // Send context-aware update request
      updateNoteMutation.mutate({ 
        content: note.content, 
        updateInstruction: `User wants to modify this note: "${inputValue.trim()}". 
        Current note context: ${JSON.stringify(fullContext)}. 
        Please intelligently update the note content, todos, priorities, timing, or other aspects based on the user's intent.
        If they're adding items, add them. If removing, remove them. If checking off todos, mark them complete.
        If changing details, priorities, or timing, update accordingly.`
      });
      
      setInputValue("");
      setIsTyping(false);
      
      toast({
        description: "Updating note with AI assistance...",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[#f5f5f5]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--border))]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={() => {
                  // Update note with new title if changed
                  if (editedTitle !== note.content) {
                    updateNoteMutation.mutate({ content: editedTitle });
                  }
                }}
                className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-300 rounded px-2 py-1"
                placeholder="Note Title"
              />
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
                <DropdownMenuItem onClick={() => setShowVersionHistory(true)}>
                  <Undo2 className="w-4 h-4 mr-2" />
                  Version History
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

        {/* Document Body - Editable like iOS Notes */}
        <div className="flex-1 bg-white">
          <div className="px-4 py-3 space-y-2">
            {/* Media Display - Full functionality with sharing and download */}
            {note.mediaUrl && (
              <div className="mb-6">
                <MediaDisplay 
                  mediaUrl={note.mediaUrl} 
                  filename={note.mediaUrl.split('/').pop()} 
                  showControls={true}
                />
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => {
                setEditedContent(e.target.value);
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              onBlur={() => {
                if (editedContent !== note.content) {
                  updateNoteMutation.mutate({ content: editedContent });
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              className="w-full min-h-[120px] text-base leading-relaxed bg-transparent border-none outline-none resize-none font-normal text-gray-800 placeholder-gray-400 mb-4"
              placeholder="Start writing..."
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                overflow: 'hidden'
              }}
            />

            {/* AI Enhanced Content - ChatGPT Style with Rich Formatting */}
            {note.aiEnhanced && note.aiContext && note.aiContext !== "Note processed" && (
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="text-sm text-gray-500 mb-3 font-medium">AI Response:</div>
                <MarkdownRenderer 
                  content={note.aiContext}
                  className="text-gray-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* Smart Action Buttons */}
        {note.aiSuggestion && (
          <div className="bg-white border-t border-[hsl(var(--border))] px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-[hsl(var(--primary))]" />
              <span className="text-sm font-medium text-[hsl(var(--foreground))]">Quick Actions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const actions = [];
                const suggestions = note.aiSuggestion.split(',').map((s: string) => s.trim());
                
                for (const suggestion of suggestions) {
                  if (suggestion.includes('Add to Calendar') || suggestion.includes('calendar')) {
                    actions.push({
                      type: 'calendar',
                      label: 'Add to Calendar',
                      icon: Calendar,
                      action: () => {
                        const calendarEvent = createCalendarEventFromContent(note.content, note.content);
                        if (calendarEvent) {
                          addToGoogleCalendar(calendarEvent);
                          toast({
                            description: "Opening Google Calendar with event details",
                          });
                        } else {
                          // Fallback for notes without time information
                          const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(note.content)}&details=${encodeURIComponent(note.aiContext || '')}`;
                          window.open(calendarUrl, '_blank');
                        }
                      }
                    });
                  } else if (suggestion.includes('Reminder') || suggestion.includes('reminder')) {
                    actions.push({
                      type: 'reminder',
                      label: 'Set Reminder',
                      icon: Bell,
                      action: () => {
                        toast({
                          description: "Reminder functionality coming soon!",
                        });
                      }
                    });
                  }
                }
                
                return actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="flex items-center space-x-2 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg text-sm font-medium hover:bg-[hsl(var(--primary))]/90 transition-colors"
                  >
                    <action.icon className="w-4 h-4" />
                    <span>{action.label}</span>
                  </button>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Web Search Results - Minimal Display */}
        {note.richContext && (
          <div className="px-4 mb-4">
            {(() => {
              try {
                const richData = JSON.parse(note.richContext);
                return (
                  <>
                    {/* From the Web Section - Streamlined */}
                    {richData.fromTheWeb && richData.fromTheWeb.length > 0 && (
                      <div className="border-t border-gray-200 pt-4">
                        <div className="text-sm text-gray-500 mb-3 font-medium">Related Results:</div>
                        <div className="space-y-2">
                          {richData.fromTheWeb.slice(0, 3).map((item: any, index: number) => (
                            <div 
                              key={index} 
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={() => item.url && window.open(item.url, '_blank')}
                            >
                              <h4 className="font-medium text-gray-900 text-sm mb-1">{item.title}</h4>
                              <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                              {item.rating && (
                                <span className="text-xs text-yellow-600 mt-1 inline-block">
                                  ⭐ {item.rating}
                                </span>
                              )}
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

        {/* Consolidated Todos with Optional Additions */}
        {note.todos && note.todos.length > 0 && (
          <div className="bg-yellow-50 mx-4 mb-4 rounded-lg border border-yellow-200">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3 text-base">Action Items</h4>
              <div className="space-y-3">
                {note.todos.map((todo: Todo) => (
                  <div key={todo.id} className="flex items-center gap-3">
                    <button
                      onClick={() => toggleTodoMutation.mutate(todo)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        todo.completed 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300'
                      }`}
                    >
                      {todo.completed && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </button>
                    <span className={`text-sm flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {todo.title}
                    </span>
                    <button
                      onClick={() => {
                        const calendarEvent = createCalendarEventFromContent(todo.title, todo.title);
                        if (calendarEvent) {
                          addToGoogleCalendar(calendarEvent);
                          toast({
                            description: "Opening Google Calendar with event details",
                          });
                        } else {
                          const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(todo.title)}&details=${encodeURIComponent(`From note: ${note.content}`)}`;
                          window.open(calendarUrl, '_blank');
                          toast({
                            description: "Opening Google Calendar",
                          });
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Add to Google Calendar"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Open reminder popup
                        toast({
                          description: "Reminder functionality coming soon!",
                        });
                      }}
                      className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                      title="Set reminder"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Optional Todo Suggestions */}
              {note.richContext && (() => {
                try {
                  const richData = JSON.parse(note.richContext);
                  const nextSteps = richData.nextSteps || [];
                  
                  // Show next steps as optional todos if they exist and aren't already todos
                  const existingTodoTitles = note.todos.map((t: Todo) => t.title.toLowerCase());
                  const optionalTodos = nextSteps.filter((step: string) => 
                    !existingTodoTitles.some((todoTitle: string) => 
                      todoTitle.includes(step.toLowerCase().slice(0, 15)) ||
                      step.toLowerCase().includes(todoTitle.slice(0, 15))
                    )
                  );

                  return optionalTodos.length > 0 ? (
                    <div className="mt-4 pt-3 border-t border-yellow-200">
                      <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Suggested</h5>
                      <div className="space-y-2">
                        {optionalTodos.slice(0, 3).map((step: string, index: number) => (
                          <div key={`optional-${index}`} className="flex items-center gap-3 p-2 bg-yellow-25 rounded border border-yellow-100">
                            <div className="w-4 h-4 border border-gray-300 rounded opacity-50"></div>
                            <span className="text-sm text-gray-700 flex-1">{step}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={async () => {
                                  try {
                                    await apiRequest('/api/todos/add-optional', 'POST', {
                                      title: step,
                                      noteId: note.id
                                    });
                                    
                                    // Refresh the note to show the new todo
                                    queryClient.invalidateQueries({ queryKey: ['/api/notes', note.id] });
                                    
                                    toast({
                                      description: "Added to todos",
                                    });
                                  } catch (error) {
                                    toast({
                                      description: "Failed to add todo",
                                      variant: "destructive"
                                    });
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Add to todos"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const reminderTime = new Date();
                                  reminderTime.setHours(reminderTime.getHours() + 1);
                                  
                                  apiRequest('/api/reminders', 'POST', {
                                    title: `Reminder: ${step}`,
                                    description: `From note: ${note.content.slice(0, 50)}...`,
                                    reminderTime: reminderTime.toISOString(),
                                    noteId: note.id
                                  }).then(() => {
                                    toast({
                                      description: "Reminder set for 1 hour",
                                    });
                                  }).catch(() => {
                                    toast({
                                      description: "Failed to set reminder",
                                      variant: "destructive"
                                    });
                                  });
                                }}
                                className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                                title="Set reminder"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                } catch (e) {
                  return null;
                }
              })()}
            </div>
          </div>
        )}

        {/* Extracted Items Display */}
        {note.items && note.items.length > 0 && (
          <div className="bg-green-50 mx-4 mb-4 rounded-lg border border-green-200">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3 text-base flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                Items Added to Collection
              </h4>
              <div className="space-y-3">
                {note.items.map((item: any, index: number) => (
                  <div key={item.id || index} className="bg-white rounded-lg p-3 border border-green-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                        )}
                        {item.category && (
                          <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded inline-block mt-2">
                            {item.category}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Shopping Links Display */}
                    {item.detailedContent && (() => {
                      try {
                        const details = typeof item.detailedContent === 'string' ? JSON.parse(item.detailedContent) : item.detailedContent;
                        return details.shoppingLinks && details.shoppingLinks.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-green-100">
                            <div className="text-xs text-gray-600 mb-2">🛒 Shopping Links:</div>
                            <div className="space-y-1">
                              {details.shoppingLinks.slice(0, 3).map((link: any, linkIndex: number) => (
                                <a
                                  key={linkIndex}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors"
                                >
                                  <div className="font-medium truncate">{link.title}</div>
                                  {link.description && (
                                    <div className="text-gray-500 truncate mt-1">{link.description.slice(0, 80)}...</div>
                                  )}
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                    
                    {item.metadata && (() => {
                      try {
                        const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
                        return Object.keys(metadata).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-green-100">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(metadata).map(([key, value]: [string, any]) => (
                                value && (
                                  <span key={key} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {key}: {String(value)}
                                  </span>
                                )
                              ))}
                            </div>
                          </div>
                        );
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                ))}
              </div>
              {note.collection && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <div className="text-sm text-green-700">
                    📚 Added to "{note.collection.name}" collection
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subtle Entities Section at Bottom */}
        {note.richContext && (() => {
          try {
            const richData = JSON.parse(note.richContext);
            return richData.entities && richData.entities.length > 0 ? (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <div className="flex flex-wrap gap-1">
                  {richData.entities.map((entity: any, index: number) => (
                    <span key={index} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {entity.value}
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          } catch {
            return null;
          }
        })()}

        {/* Document Metadata - Bottom of page */}
        <div className="px-4 py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 space-y-1">
          <div>Last modified {note.createdAt ? formatDistanceToNow(new Date(note.createdAt)) + ' ago' : 'Unknown'}</div>
          <div>Created {note.createdAt ? format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a") : 'Unknown date'}</div>
        </div>


      </div>
      {/* Input Bar - Same style as other pages */}
      <div 
        className="fixed bottom-24 left-4 right-4 transition-transform duration-300 translate-x-0 opacity-100"
        style={{ 
          zIndex: 9999,
          position: 'fixed',
          bottom: 'calc(3.5rem + 16px)', // Match other input bars
          left: '1rem',
          right: '1rem',
          filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
        }}
      >
        <div className="border border-gray-300 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-1.5 bg-white">
          <textarea
            placeholder="Add/edit anything here..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-600 text-gray-900 resize-none overflow-hidden"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            rows={1}
            style={{
              minHeight: '20px',
              maxHeight: '120px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          {isTyping ? (
            <>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                title="Add attachment"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={handleSendMessage}
                className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors bg-[#f1efe8]"
                title="PLUS BUTTON - Grey"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: '#a8bfa1' }}
              >
                <Camera className="w-4 h-4" />
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 text-gray-700 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: '#9bb8d3' }}
              >
                <Mic className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Version History Dialog */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Version History</h3>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-3 overflow-y-auto max-h-96">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Current Version</div>
                  <div className="text-xs text-gray-500">
                    {note?.content?.substring(0, 100)}...
                  </div>
                </div>
              </div>
              
              {versionHistory && Array.isArray(versionHistory) && versionHistory.map((version: any, index: number) => (
                <div key={version.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      Version {version.version} - {version.changeType}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {version.changeDescription} | {format(new Date(version.createdAt), 'MMM d, h:mm a')}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {version.content?.substring(0, 80)}...
                    </div>
                    <button
                      onClick={() => rollbackMutation.mutate(version.version)}
                      disabled={rollbackMutation.isPending}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {rollbackMutation.isPending ? 'Rolling back...' : 'Restore'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Approval Dialog for High-Risk Changes */}
      {showApprovalDialog && pendingChanges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-semibold">AI Wants to Make Changes</h3>
              </div>
              <button
                onClick={() => {
                  setShowApprovalDialog(false);
                  setPendingChanges(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto max-h-96">
              <div className="text-sm text-gray-600">
                AI detected valuable content that could be affected by these changes. Please review before proceeding.
              </div>
              
              {pendingChanges.warnings && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-800 mb-2">Protected Content:</div>
                  <ul className="space-y-1">
                    {pendingChanges.warnings.map((warning: string, index: number) => (
                      <li key={index} className="text-xs text-orange-700">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border rounded-lg p-3">
                <div className="text-sm font-medium mb-2">Suggested Changes:</div>
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                  {pendingChanges.suggestedChanges}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Or clarify your instruction:</div>
                <textarea
                  value={clarificationInput}
                  onChange={(e) => setClarificationInput(e.target.value)}
                  placeholder="Explain what you meant in more detail..."
                  className="w-full p-2 border rounded-lg text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-2 p-4 border-t">
              <button
                onClick={() => {
                  setShowApprovalDialog(false);
                  setPendingChanges(null);
                }}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              
              {clarificationInput && (
                <button
                  onClick={() => {
                    clarifyMutation.mutate({
                      originalInstruction: pendingChanges.originalInstruction || '',
                      clarification: clarificationInput
                    });
                    setShowApprovalDialog(false);
                    setPendingChanges(null);
                  }}
                  disabled={clarifyMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {clarifyMutation.isPending ? 'Clarifying...' : 'Clarify & Apply'}
                </button>
              )}
              
              <button
                onClick={() => {
                  approveChangesMutation.mutate({
                    suggestedChanges: pendingChanges.suggestedChanges,
                    userApproved: true
                  });
                }}
                disabled={approveChangesMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-1 inline" />
                {approveChangesMutation.isPending ? 'Applying...' : 'Approve Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}