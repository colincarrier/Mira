
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { Check, Circle, Clock, AlertCircle, Pin, Bell, X, Send, Mic } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import SimpleTextInput from "@/components/simple-text-input";
import FullScreenCapture from "@/components/full-screen-capture";
import IOSVoiceRecorder from "@/components/ios-voice-recorder";
import AIProcessingIndicator from "@/components/ai-processing-indicator";
import { useToast } from "@/hooks/use-toast";

type ReminderFilterType = 'today' | 'week' | 'month' | 'year';
type TodoFilterType = 'all' | 'urgent' | 'pinned';

export default function Remind() {
  const [, setLocation] = useLocation();
  const [isFullScreenCaptureOpen, setIsFullScreenCaptureOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [activeReminderFilter, setActiveReminderFilter] = useState<ReminderFilterType>('today');
  const [activeTodoFilter, setActiveTodoFilter] = useState<TodoFilterType>('all');
  const [remindPopup, setRemindPopup] = useState<{ isOpen: boolean; todo: Todo | null }>({ isOpen: false, todo: null });
  const [remindInput, setRemindInput] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: todos, isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Debug logging to see what data we're getting
  console.log("Remind - todos data:", todos);
  console.log("Remind - isLoading:", isLoading);

  // Create todo/reminder mutation
  const createTodoMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: text,
          mode: "text",
          context: "todo_creation"
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

  const setReminder = useMutation({
    mutationFn: async ({ todoId, remindText }: { todoId: number; remindText: string }) => {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: `Set reminder for todo: ${remindText}`,
          mode: "text",
          context: "reminder_creation"
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to set reminder");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setRemindPopup({ isOpen: false, todo: null });
      setRemindInput('');
      toast({
        title: "Reminder set",
        description: "Your reminder has been processed.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Reminder creation error:", error);
      toast({
        title: "Error",
        description: "Failed to set reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemindClick = (todo: Todo) => {
    setRemindPopup({ isOpen: true, todo });
    if (todo.isActiveReminder && todo.timeDue) {
      setRemindInput(`Reminder set for ${formatDistanceToNow(new Date(todo.timeDue), { addSuffix: true })}`);
    } else {
      setRemindInput('');
    }
  };

  const handleRemindSubmit = () => {
    if (remindPopup.todo && remindInput.trim()) {
      setReminder.mutate({ todoId: remindPopup.todo.id, remindText: remindInput });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-[hsl(var(--background))] min-h-screen relative flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Filter functions
  const filterReminders = (items: Todo[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    return items.filter(item => {
      if (!item.timeDue) return activeReminderFilter === 'today';
      const dueDate = new Date(item.timeDue);
      
      switch (activeReminderFilter) {
        case 'today':
          return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        case 'week':
          return dueDate >= weekStart;
        case 'month':
          return dueDate >= monthStart;
        case 'year':
          return dueDate >= yearStart;
        default:
          return true;
      }
    });
  };

  const filterTodos = (items: Todo[]) => {
    switch (activeTodoFilter) {
      case 'urgent':
        return items.filter(item => item.priority === 'urgent');
      case 'pinned':
        return items.filter(item => item.pinned);
      case 'all':
      default:
        return items;
    }
  };

  // Separate and filter reminders and todos
  const allReminders = todos?.filter(t => t.isActiveReminder && !t.completed && !t.archived) || [];
  const allTodos = todos?.filter(t => !t.isActiveReminder && !t.completed && !t.archived) || [];
  
  const reminders = filterReminders(allReminders);
  const regularTodos = filterTodos(allTodos);

  return (
    <div className="w-full bg-[hsl(var(--background))] min-h-screen relative">
      {/* Status Bar */}
      <div className="safe-area-top bg-[hsl(var(--background))]"></div>

      {/* Main Content */}
      <div className="pb-24 px-4">
        {/* Header */}
        <div className="pt-6 mb-6">
          <h2 className="text-2xl font-serif font-medium text-gray-900 dark:text-gray-100">
            Remind
          </h2>
        </div>

        {/* Reminders Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between px-0 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Reminders</h3>
              <span className="text-sm text-gray-500">({reminders.length})</span>
            </div>
            <div className="flex gap-1">
              {(['today', 'week', 'month', 'year'] as ReminderFilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveReminderFilter(filter)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    activeReminderFilter === filter
                      ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {reminders.length === 0 ? (
            <div className="px-4 py-1">
              <p className="text-gray-500 text-sm">
                No reminders {activeReminderFilter === 'today' ? 'today' : 
                          activeReminderFilter === 'week' ? 'this week' :
                          activeReminderFilter === 'month' ? 'this month' :
                          'this year'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center gap-3 py-1">
                  <button
                    onClick={() => toggleComplete.mutate(reminder.id)}
                    className="text-gray-400 hover:text-green-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>

                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setLocation(`/todo/${reminder.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium truncate ${
                        reminder.completed 
                          ? 'line-through text-gray-500 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {reminder.title}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-orange-600 ml-2">
                        {reminder.timeDue && (
                          <span>
                            {formatDistanceToNow(new Date(reminder.timeDue), { addSuffix: true })}
                          </span>
                        )}
                        {reminder.priority === 'urgent' && <AlertCircle className="w-3 h-3" />}
                        {reminder.pinned && <Pin className="w-3 h-3 text-yellow-500" />}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemindClick(reminder)}
                    className="p-1 text-orange-500 hover:text-orange-700 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* To-do's Section */}
        <div>
          <div className="flex items-center justify-between px-0 mb-3">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">To-do's</h3>
              <span className="text-sm text-gray-500">({regularTodos.length})</span>
            </div>
            <div className="flex gap-1">
              {(['all', 'urgent', 'pinned'] as TodoFilterType[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveTodoFilter(filter)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    activeTodoFilter === filter
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {regularTodos.length === 0 ? (
            <div className="px-4 py-1">
              <p className="text-gray-500 text-sm">
                No {activeTodoFilter === 'all' ? 'todos' : activeTodoFilter} todos yet
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {regularTodos.map((todo) => (
                <div key={todo.id} className="flex items-center gap-3 py-1">
                  <button
                    onClick={() => toggleComplete.mutate(todo.id)}
                    className="text-gray-400 hover:text-green-600 transition-colors"
                  >
                    <Circle className="w-4 h-4" />
                  </button>

                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setLocation(`/todo/${todo.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium truncate ${
                        todo.completed 
                          ? 'line-through text-gray-500 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {todo.title}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500 ml-2">
                        {todo.timeDue && (
                          <span>
                            {formatDistanceToNow(new Date(todo.timeDue), { addSuffix: true })}
                          </span>
                        )}
                        {todo.priority === 'urgent' && <AlertCircle className="w-3 h-3 text-red-500" />}
                        {todo.pinned && <Pin className="w-3 h-3 text-yellow-500" />}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemindClick(todo)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Remind Popup */}
      {remindPopup.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-[60] p-4 pb-32">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Set Reminder
              </h3>
              <button
                onClick={() => setRemindPopup({ isOpen: false, todo: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {remindPopup.todo && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {remindPopup.todo.title}
                </p>
                
                {remindPopup.todo.isActiveReminder && remindPopup.todo.timeDue ? (
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Current reminder: {formatDistanceToNow(new Date(remindPopup.todo.dueDate), { addSuffix: true })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        value={remindInput}
                        onChange={(e) => setRemindInput(e.target.value)}
                        placeholder="e.g., 'in 2 hours', 'tomorrow at 9am', 'next Monday'"
                        className="w-full pl-3 pr-20 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300/50"
                        autoFocus
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <button
                          onClick={() => {
                            // TODO: Implement voice input
                            console.log('Voice input clicked');
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                        {remindInput.trim() && (
                          <button
                            onClick={handleRemindSubmit}
                            className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Bar */}
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
      <AIProcessingIndicator isProcessing={false} position="fixed" />
    </div>
  );
}
