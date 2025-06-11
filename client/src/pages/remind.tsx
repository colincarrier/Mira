import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { Check, Circle, Clock, AlertCircle, Pin, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import SimpleTextInput from "@/components/simple-text-input";
import FullScreenCapture from "@/components/full-screen-capture";
import IOSVoiceRecorder from "@/components/ios-voice-recorder";
import AIProcessingIndicator from "@/components/ai-processing-indicator";
import { useToast } from "@/hooks/use-toast";

export default function Remind() {
  const [, setLocation] = useLocation();
  const [isFullScreenCaptureOpen, setIsFullScreenCaptureOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

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

  const deleteTodo = useMutation({
    mutationFn: (todoId: number) => apiRequest(`/api/todos/${todoId}`, "DELETE"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/todos"] }),
  });

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

  // Separate reminders and todos
  const reminders = todos?.filter(t => t.isActiveReminder && !t.completed && !t.archived) || [];
  const regularTodos = todos?.filter(t => !t.isActiveReminder && !t.completed && !t.archived) || [];

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
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Reminders</h3>
            <span className="text-sm text-gray-500">({reminders.length})</span>
          </div>

          {reminders.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No active reminders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-start gap-3 py-2">
                  <button
                    onClick={() => toggleComplete.mutate(reminder.id)}
                    className="mt-1 text-gray-400 hover:text-green-600 transition-colors"
                  >
                    <Circle className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                      onClick={() => setLocation(`/todo/${reminder.id}`)}
                    >
                      {reminder.title}
                    </div>

                    {reminder.description && (
                      <div className="text-xs text-gray-500 mt-1">{reminder.description}</div>
                    )}

                    {reminder.dueDate && (
                      <div className="text-xs text-orange-600 mt-1">
                        Due {formatDistanceToNow(new Date(reminder.dueDate), { addSuffix: true })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => deleteTodo.mutate(reminder.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* To-do's Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Check className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">To-do's</h3>
            <span className="text-sm text-gray-500">({regularTodos.length})</span>
          </div>

          {regularTodos.length === 0 ? (
            <div className="text-center py-8">
              <Circle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No todos yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {regularTodos.map((todo) => (
                <div key={todo.id} className="flex items-start gap-3 py-2">
                  <button
                    onClick={() => toggleComplete.mutate(todo.id)}
                    className="mt-1 text-gray-400 hover:text-green-600 transition-colors"
                  >
                    <Circle className="w-4 h-4" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                      onClick={() => setLocation(`/todo/${todo.id}`)}
                    >
                      {todo.title}
                    </div>

                    {todo.description && (
                      <div className="text-xs text-gray-500 mt-1">{todo.description}</div>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      {todo.priority === 'urgent' && (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}

                      {todo.pinned && (
                        <Pin className="w-3 h-3 text-yellow-500" />
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
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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