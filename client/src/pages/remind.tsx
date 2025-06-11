
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { Check, Pin, Archive, Clock, AlertCircle, Star, Filter, ChevronDown, ChevronRight, Circle, Search, Mic, Copy, Trash2, MoreHorizontal, X, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BottomNavigation from "@/components/bottom-navigation";
import SimpleTextInput from "@/components/simple-text-input";
import FullScreenCapture from "@/components/full-screen-capture";
import IOSVoiceRecorder from "@/components/ios-voice-recorder";
import AIProcessingIndicator from "@/components/ai-processing-indicator";
import { useToast } from "@/hooks/use-toast";

type FilterType = 'all' | 'urgent' | 'today' | 'pinned' | 'completed' | 'archived';
type ReminderFilterType = 'today' | 'week' | 'month' | 'year';

export default function Remind() {
  const [isFullScreenCaptureOpen, setIsFullScreenCaptureOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [reminderFilter, setReminderFilter] = useState<ReminderFilterType>('today');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['reminders', 'todos']));
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: todos, isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Create todo/reminder mutation
  const createTodoMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: text,
          mode: "text",
          context: "todo_creation" // Context for AI to know this is todo-focused
        }),
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to create todo/reminder");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      toast({
        title: "Todo/Reminder created",
        description: "Your item has been processed successfully.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Todo creation error:", error);
      toast({
        title: "Error",
        description: "Failed to create todo/reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleTextSubmit = (text: string) => {
    console.log('📋 REMIND handleTextSubmit called with:', text);
    createTodoMutation.mutate(text);
  };

  const toggleComplete = useMutation({
    mutationFn: (todoId: number) => apiRequest(`/api/todos/${todoId}/toggle`, "PATCH"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/todos"] }),
  });

  const deleteTodo = useMutation({
    mutationFn: (todoId: number) => apiRequest(`/api/todos/${todoId}`, "DELETE"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/todos"] }),
  });

  const getFilteredTodos = () => {
    if (!todos) return [];
    
    switch (filter) {
      case 'urgent':
        return todos.filter(t => t.priority === 'urgent' && !t.completed && !t.archived);
      case 'today':
        const today = new Date().toDateString();
        return todos.filter(t => !t.completed && !t.archived && 
          (t.dueDate ? new Date(t.dueDate).toDateString() === today : false));
      case 'pinned':
        return todos.filter(t => t.pinned && !t.completed && !t.archived);
      case 'completed':
        return todos.filter(t => t.completed && !t.archived);
      case 'archived':
        return todos.filter(t => t.archived);
      default:
        return todos.filter(t => !t.completed && !t.archived);
    }
  };

  const groupTodosByNote = (todos: Todo[]) => {
    const grouped = todos.reduce((acc, todo) => {
      const noteId = todo.noteId || 'standalone';
      if (!acc[noteId]) acc[noteId] = [];
      acc[noteId].push(todo);
      return acc;
    }, {} as Record<string, Todo[]>);
    
    return grouped;
  };

  const filteredTodos = getFilteredTodos();
  const activeTodos = todos?.filter(t => !t.completed && !t.archived) || [];
  const pinnedCount = todos?.filter(t => t.pinned && !t.completed && !t.archived).length || 0;
  const urgentCount = todos?.filter(t => t.priority === 'urgent' && !t.completed && !t.archived).length || 0;
  
  const groupedTodos = groupTodosByNote(filteredTodos);

  const filterButtons = [
    { key: 'all', label: 'All', count: activeTodos.length, icon: null },
    { key: 'pinned', label: 'Pins', count: pinnedCount, icon: Pin },
    { key: 'urgent', label: 'Urgent', count: urgentCount, icon: AlertCircle },
    { key: 'completed', label: 'Done', count: todos?.filter(t => t.completed && !t.archived).length || 0, icon: Check },
  ];

  // Separate reminders and todos
  const reminders = todos?.filter(t => t.isActiveReminder && !t.completed && !t.archived) || [];
  const regularTodos = todos?.filter(t => !t.isActiveReminder && !t.completed && !t.archived) || [];

  const hasProcessingNotes = false; // You can connect this to your processing state

  return (
    <div className="w-full bg-[hsl(var(--background))] min-h-screen relative">
      {/* Status Bar */}
      <div className="safe-area-top bg-[hsl(var(--background))]"></div>
      
      {/* Main Content */}
      <div className="pb-24">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4 pt-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif font-medium text-gray-900 dark:text-gray-100">
                Remind
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <Search size={18} />
              </button>
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="px-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filterButtons.map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key as FilterType)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === btn.key
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {btn.icon && <btn.icon size={14} />}
                  <span>{btn.label}</span>
                  {btn.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      filter === btn.key ? 'bg-blue-200' : 'bg-gray-200'
                    }`}>
                      {btn.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Reminders Section */}
          {reminders.length > 0 && (
            <div className="px-4">
              <div className="bg-white rounded-lg border border-gray-200">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => {
                    const newExpanded = new Set(expandedGroups);
                    if (expandedGroups.has('reminders')) {
                      newExpanded.delete('reminders');
                    } else {
                      newExpanded.add('reminders');
                    }
                    setExpandedGroups(newExpanded);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">Active Reminders</span>
                    <span className="text-sm text-gray-500">({reminders.length})</span>
                  </div>
                  {expandedGroups.has('reminders') ? 
                    <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
                </div>
                
                {expandedGroups.has('reminders') && (
                  <div className="border-t border-gray-100">
                    {reminders.map((reminder) => (
                      <div key={reminder.id} className="p-3 border-b border-gray-50 last:border-b-0">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleComplete.mutate(reminder.id)}
                            className="mt-1 text-gray-400 hover:text-green-600 transition-colors"
                          >
                            <Circle className="w-4 h-4" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{reminder.title}</div>
                            {reminder.description && (
                              <div className="text-xs text-gray-500 mt-1">{reminder.description}</div>
                            )}
                            {reminder.dueDate && (
                              <div className="text-xs text-orange-600 mt-1">
                                Due {formatDistanceToNow(new Date(reminder.dueDate), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Todos Content */}
          <div className="px-4 space-y-4">
            {Object.keys(groupedTodos).length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No items yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first todo or reminder using the input bar below.
                </p>
              </div>
            ) : (
              Object.entries(groupedTodos).map(([noteId, noteTodos]) => (
                <div key={noteId} className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 space-y-3">
                    {noteTodos.map((todo) => (
                      <div key={todo.id} className="flex items-start gap-3 group">
                        <button
                          onClick={() => toggleComplete.mutate(todo.id)}
                          className={`mt-1 transition-colors ${
                            todo.completed
                              ? 'text-green-600'
                              : 'text-gray-400 hover:text-green-600'
                          }`}
                        >
                          {todo.completed ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${
                            todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {todo.title}
                          </div>
                          
                          {todo.description && (
                            <div className="text-xs text-gray-500 mt-1">{todo.description}</div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            {todo.priority === 'urgent' && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                                <AlertCircle className="w-3 h-3" />
                                Urgent
                              </span>
                            )}
                            
                            {todo.pinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                                <Pin className="w-3 h-3" />
                                Pinned
                              </span>
                            )}
                            
                            {todo.dueDate && (
                              <span className="text-xs text-gray-500">
                                Due {formatDistanceToNow(new Date(todo.dueDate), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => deleteTodo.mutate(todo.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Context-specific Input Bar for Todos/Reminders */}
      <SimpleTextInput 
        onCameraCapture={() => setIsFullScreenCaptureOpen(true)}
        onNewNote={() => setIsVoiceModalOpen(true)}
        onTextSubmit={handleTextSubmit}
        placeholder="Add a todo or reminder..."
        context="remind"
      />

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Modals */}
      <IOSVoiceRecorder 
        isOpen={isVoiceModalOpen} 
        onClose={() => setIsVoiceModalOpen(false)} 
      />

      <FullScreenCapture
        isOpen={isFullScreenCaptureOpen}
        onClose={() => setIsFullScreenCaptureOpen(false)}
      />

      {/* AI Processing Indicator */}
      <AIProcessingIndicator isProcessing={hasProcessingNotes} position="fixed" />
    </div>
  );
}
