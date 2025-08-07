import { useState, useEffect, useRef } from "react";
import { useParams, useLocation as useRouterLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, MoreHorizontal, Trash2, History, Star, Copy, Zap, Calendar, Bell, CheckSquare, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MediaDisplay } from "@/components/MediaDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { queryKeys } from "@/utils/queryKeys";

interface Note {
  id: number;
  content: string;
  mode: string;
  mediaUrl?: string;
  aiEnhanced: boolean;
  aiSuggestion?: string;
  aiContext?: string;
  richContext?: string;
  originalContent?: string;
  todos?: Todo[];
  collectionId?: number;
}

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority?: string;
}

export default function NoteDetailNew() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useRouterLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: note, isLoading } = useQuery<Note>({
    queryKey: queryKeys.notes.detail(parseInt(id || "0")),
    enabled: !!id,
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      return apiRequest(`/api/notes/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(parseInt(id || "0")) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/notes/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
      setLocation("/");
      toast({ description: "Note deleted successfully" });
    },
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async ({ todoId, completed }: { todoId: number; completed: boolean }) => {
      return apiRequest(`/api/todos/${todoId}`, "PATCH", { completed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(parseInt(id || "0")) });
    },
  });

  useEffect(() => {
    if (note) {
      setEditedTitle(note.content);
      setEditedContent(note.content);
    }
  }, [note]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: note?.content || "Note",
          text: note?.content || "",
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(note?.content || "");
      toast({ description: "Note copied to clipboard" });
    }
  };

  if (isLoading || !note) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading note...</p>
        </div>
      </div>
    );
  }

  const originalUserContent = note.originalContent || (note.aiEnhanced ? extractOriginalFromContent(note.content) : note.content);

  function extractOriginalFromContent(content: string): string {
    const lines = content.split('\n');
    return lines[0] || content;
  }

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f5]">
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
                <History className="w-4 h-4 mr-2" />
                Version History
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteNoteMutation.mutate()}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content - ChatGPT Style */}
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {/* Media Display */}
          {note.mediaUrl && (
            <div className="mb-6">
              <MediaDisplay 
                mediaUrl={note.mediaUrl} 
                filename={note.mediaUrl.split('/').pop()} 
                showControls={true}
              />
            </div>
          )}

          {/* Original User Input */}
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="text-sm text-gray-600 mb-2 font-medium">Your request:</div>
            <div className="text-gray-900 text-base leading-relaxed">
              {originalUserContent}
            </div>
          </div>

          {/* AI Response Content */}
          {note.aiEnhanced && note.aiContext && note.aiContext !== "Note processed" && (
            <div className="bg-white">
              <div className="prose prose-gray max-w-none">
                <div className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                  {note.aiContext}
                </div>
              </div>
            </div>
          )}

          {/* Todos Section - Clean & Minimal */}
          {note.todos && Array.isArray(note.todos) && note.todos.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
              </div>
              <div className="space-y-3">
                {note.todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => toggleTodoMutation.mutate({
                        todoId: todo.id,
                        completed: !todo.completed
                      })}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {todo.completed && <CheckSquare className="w-3 h-3" />}
                    </button>
                    <span className={`flex-1 text-base ${
                      todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {todo.title}
                    </span>
                    {todo.priority === 'high' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        High Priority
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <button className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Plus className="w-4 h-4" />
                Add todo
              </button>
            </div>
          )}

          {/* Quick Actions */}
          {note.aiSuggestion && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Quick Actions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {note.aiSuggestion.includes('calendar') && (
                  <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    <Calendar className="w-4 h-4" />
                    Add to Calendar
                  </button>
                )}
                {note.aiSuggestion.includes('reminder') && (
                  <button className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                    <Bell className="w-4 h-4" />
                    Set Reminder
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Collection Assignment */}
          {note.collectionId && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Collection:</span> Auto-assigned based on content
            </div>
          )}

          {/* Editable Notes Area */}
          <div className="border-t border-gray-200 pt-6">
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
              className="w-full min-h-[100px] text-base leading-relaxed bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400"
              placeholder="Add your own notes or modifications..."
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                overflow: 'hidden'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}