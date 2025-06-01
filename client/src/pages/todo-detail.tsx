import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ChevronLeft, CheckCircle2, Circle, Pin, Archive, Calendar, AlertCircle } from "lucide-react";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import type { Todo, NoteWithTodos } from "@shared/schema";

export default function TodoDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: todos } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const { data: notes } = useQuery<NoteWithTodos[]>({
    queryKey: ["/api/notes"],
  });

  const todo = todos?.find(t => t.id === parseInt(id || "0"));
  const sourceNote = notes?.find(n => n.id === todo?.noteId);

  const toggleTodoMutation = useMutation({
    mutationFn: async (updates: Partial<Todo>) => {
      if (!id) throw new Error("No todo ID");
      const response = await apiRequest("PATCH", `/api/todos/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const pinTodoMutation = useMutation({
    mutationFn: async () => {
      if (!todo) throw new Error("No todo data");
      const response = await apiRequest("PATCH", `/api/todos/${id}`, {
        pinned: !todo.pinned
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const archiveTodoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/todos/${id}`, {
        archived: true
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setLocation("/");
    },
  });

  if (!todo || !id) {
    return (
      <div className="mx-auto max-w-sm w-full h-full flex flex-col">
        <header className="bg-white px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setLocation("/")}
              className="flex items-center text-[hsl(var(--ios-blue))] touch-manipulation"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <h1 className="text-lg font-semibold">Loading...</h1>
            <div className="w-12"></div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleToggle = () => {
    toggleTodoMutation.mutate({ completed: !todo.completed });
  };

  const handlePin = () => {
    pinTodoMutation.mutate();
  };

  const handleArchive = () => {
    archiveTodoMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-sm w-full h-full flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setLocation("/")}
            className="flex items-center text-[hsl(var(--ios-blue))] touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="text-lg font-semibold">Todo Details</h1>
          <div className="flex items-center space-x-1">
            <button 
              onClick={handlePin}
              className={`p-2 touch-manipulation ${todo.pinned ? 'text-amber-600' : 'text-gray-400'}`}
            >
              <Pin className="w-5 h-5" />
            </button>
            <button 
              onClick={handleArchive}
              className="p-2 text-gray-400 touch-manipulation"
            >
              <Archive className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Todo Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start space-x-3">
              <button 
                onClick={handleToggle}
                disabled={toggleTodoMutation.isPending}
                className="mt-1 touch-manipulation"
              >
                {todo.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6 text-gray-400" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <h2 className={`font-medium text-lg leading-tight ${
                  todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                }`}>
                  {todo.title}
                </h2>
                
                <div className="flex items-center space-x-2 mt-2">
                  {todo.priority === "urgent" && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-red-800 bg-red-50 border border-red-200">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Urgent
                    </span>
                  )}
                  
                  {todo.pinned && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200">
                      <Pin className="w-3 h-3 mr-1" />
                      Pinned
                    </span>
                  )}
                  
                  <span className="text-xs text-gray-500">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    {new Date(todo.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Source Note */}
          {sourceNote && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Source Note</h3>
              <div 
                onClick={() => setLocation(`/note/${sourceNote.id}`)}
                className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow touch-manipulation"
              >
                <p className="text-sm text-gray-800 line-clamp-3">{sourceNote.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(sourceNote.createdAt).toLocaleDateString()}
                  </span>
                  {sourceNote.todos && sourceNote.todos.length > 1 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {sourceNote.todos.length} todos from this note
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}