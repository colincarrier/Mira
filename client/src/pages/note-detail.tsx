import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Clock, MessageSquare, CheckSquare, Folder, Share2, Edit3, Send, Shell, Fish, Anchor, Ship, Eye, Brain, Sparkles, Zap, Gem, Circle, MoreHorizontal, Star, Archive, Trash2, Camera, Mic, Paperclip, Image, File, Copy, ArrowUpRight, Plus, Bell, Calendar, ExternalLink, Info, ArrowRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { NoteWithTodos, Todo } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AIProcessingIndicator from "@/components/ai-processing-indicator";
import MediaDisplay from "@/components/media-display";

export default function NoteDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [showContextDialog, setShowContextDialog] = useState(false);

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
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] bg-[#f5f5f5]">
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
                  if (editedTitle !== note.content.split('\n')[0]) {
                    const newContent = editedTitle + '\n' + note.content.split('\n').slice(1).join('\n');
                    updateNoteMutation.mutate({ content: newContent });
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
                // Auto-expand textarea
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              onBlur={() => {
                // Auto-save on blur if content changed
                if (editedContent !== note.content) {
                  updateNoteMutation.mutate({ content: editedContent });
                }
              }}
              onInput={(e) => {
                // Ensure textarea expands properly on all input events
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
              className="w-full min-h-[120px] text-base leading-relaxed bg-transparent border-none outline-none resize-none font-normal text-gray-800 placeholder-gray-400 mb-2"
              placeholder="Start writing..."
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                overflow: 'hidden'
              }}
            />
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
                        const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(note.content)}&details=${encodeURIComponent(note.aiContext || '')}`;
                        window.open(calendarUrl, '_blank');
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

        {/* AI Research Results */}
        {note.richContext && (
          <div className="space-y-0">
            {(() => {
              try {
                const richData = JSON.parse(note.richContext);
                return (
                  <>


                    {/* Clarifying Questions - Non-redundant only */}
                    {richData.microQuestions && richData.microQuestions.length > 0 && (() => {
                      // Filter out questions that are redundant with next steps or existing todos
                      const nextStepsText = (richData.nextSteps || []).join(' ').toLowerCase();
                      const todosText = (note.todos || []).map((t: any) => t.title).join(' ').toLowerCase();
                      
                      const uniqueQuestions = richData.microQuestions.filter((question: string) => {
                        const questionLower = question.toLowerCase();
                        return !nextStepsText.includes(questionLower.slice(0, 20)) && 
                               !todosText.includes(questionLower.slice(0, 20));
                      });
                      
                      return uniqueQuestions.length > 0 ? (
                        <div className="bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
                          <div className="px-4 py-4">
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="w-4 h-4 text-[hsl(var(--primary))]" />
                              <h3 className="font-medium text-[hsl(var(--foreground))]">Consider</h3>
                            </div>
                            <div className="space-y-2">
                              {uniqueQuestions.map((question: string, index: number) => (
                                <div key={index} className="p-2 bg-[hsl(var(--secondary))] rounded text-sm text-[hsl(var(--foreground))]">
                                  {question}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* From the Web Section */}
                    {richData.fromTheWeb && richData.fromTheWeb.length > 0 && (
                      <div className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
                        <div className="px-4 py-6">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">🌐</span>
                            </div>
                            <h3 className="font-semibold text-[hsl(var(--foreground))]">From the Web</h3>
                          </div>
                          <div className="space-y-4">
                            {richData.fromTheWeb.map((item: any, index: number) => (
                              <div 
                                key={index} 
                                className="p-4 bg-[hsl(var(--muted))] rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] cursor-pointer transition-colors"
                                onClick={() => item.url && window.open(item.url, '_blank')}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-[hsl(var(--foreground))] line-clamp-2">{item.title}</h4>
                                  {item.rating && (
                                    <span className="text-xs text-[hsl(var(--muted-foreground))] bg-yellow-100 px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                                      ⭐ {item.rating}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">
                                  {item.description}
                                </p>
                                {item.keyPoints && item.keyPoints.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {item.keyPoints.slice(0, 3).map((point: string, pointIndex: number) => (
                                      <span key={pointIndex} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        {point}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.source && (
                                  <div className="flex justify-between items-center text-xs text-[hsl(var(--muted-foreground))]">
                                    <span>{item.source}</span>
                                    {item.lastUpdated && <span>{item.lastUpdated}</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Next Steps - Consolidated Section */}
                    {(richData.nextSteps || richData.recommendedActions) && (
                      <div className="bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
                        <div className="px-4 py-4">
                          <div className="flex items-center gap-2 mb-3">
                            <ArrowRight className="w-4 h-4 text-[hsl(var(--primary))]" />
                            <h3 className="font-medium text-[hsl(var(--foreground))]">Next Steps</h3>
                          </div>
                          <div className="space-y-2">
                            {richData.nextSteps && richData.nextSteps.map((step: string, index: number) => (
                              <div key={`step-${index}`} className="flex items-start gap-3 p-3 bg-[hsl(var(--accent))] rounded-lg">
                                <div className="w-5 h-5 bg-[hsl(var(--primary))] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs text-[hsl(var(--primary-foreground))] font-medium">{index + 1}</span>
                                </div>
                                <p className="text-sm text-[hsl(var(--foreground))] flex-1">{step}</p>
                              </div>
                            ))}
                            {richData.recommendedActions && richData.recommendedActions.map((action: any, index: number) => (
                              <div key={`action-${index}`} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs text-white font-medium">{(richData.nextSteps?.length || 0) + index + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-blue-900 mb-1">{action.title}</div>
                                  <div className="text-sm text-blue-800">{action.description}</div>
                                  {action.links && action.links.length > 0 && (
                                    <div className="mt-2 space-y-1">
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
                              <div key={index} className="border border-[hsl(var(--border))] rounded-lg p-3 hover:border-[hsl(var(--accent))] transition-colors cursor-pointer" onClick={() => handleQuestionClick(result.title)}>
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-medium text-sm text-blue-600 hover:text-blue-800">{result.title}</h4>
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

                    {/* Follow-up Questions */}
                    {richData.quickInsights && richData.quickInsights.length > 0 && (
                      <div className="bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]">
                        <div className="px-4 py-6">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">?</span>
                            </div>
                            <h3 className="font-medium text-[hsl(var(--foreground))]">Next Steps</h3>
                          </div>
                          <div className="grid gap-2">
                            {richData.quickInsights.map((insight: string, index: number) => {
                              // Convert insights to actionable questions
                              const question = insight.includes('?') ? insight : `${insight}?`;
                              const questionText = question.replace('?', '');
                              
                              return (
                                <button
                                  key={index}
                                  onClick={() => setInputValue(`${questionText}:`)}
                                  className="text-sm p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-left"
                                >
                                  <span className="text-orange-600 mr-2">→</span>
                                  {question}
                                </button>
                              );
                            })}
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

        {/* AI Research Results - Embedded in document flow */}
        {note.richContext && (
          <div className="bg-gray-50 mx-4 mb-4 rounded-lg border border-gray-200">
            {(() => {
              try {
                const richData = JSON.parse(note.richContext);
                return (
                  <div className="p-4 space-y-4">
                    {/* Research Results */}
                    {richData.researchResults && richData.researchResults.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 text-base">Research Findings</h4>
                        <div className="space-y-3">
                          {richData.researchResults.map((result: any, index: number) => (
                            <div 
                              key={index} 
                              className="p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer" 
                              onClick={() => handleQuestionClick(result.title)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium text-blue-600 hover:text-blue-800 text-sm">{result.title}</h5>
                                {result.rating && (
                                  <div className="text-xs text-yellow-600 flex items-center gap-1">
                                    <span>★</span>
                                    <span>{result.rating}</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                              {result.keyPoints && (
                                <ul className="space-y-1 mb-2">
                                  {result.keyPoints.map((point: string, pointIndex: number) => (
                                    <li key={pointIndex} className="text-xs text-gray-500 flex items-start gap-1">
                                      <span className="text-green-500">•</span>
                                      {point}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {result.contact && (
                                <div className="text-xs text-gray-500 mt-2">
                                  Contact: {result.contact}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Questions */}
                    {richData.quickInsights && richData.quickInsights.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 text-base">Next Questions</h4>
                        <div className="space-y-2">
                          {richData.quickInsights.map((insight: string, index: number) => (
                            <button
                              key={index}
                              onClick={() => handleQuestionClick(insight)}
                              className="block w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:border-blue-300 transition-colors text-sm text-blue-800"
                            >
                              {insight}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
          bottom: '6rem',
          left: '1rem',
          right: '1rem'
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
                onClick={() => {}}
                className="w-8 h-8 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-full flex items-center justify-center transition-colors"
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
    </div>
  );
}