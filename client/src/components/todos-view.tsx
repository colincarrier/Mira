import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { Check, ExternalLink } from "lucide-react";

export default function TodosView() {
  const queryClient = useQueryClient();
  const { data: todos, isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  const toggleTodoMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: number; completed: boolean }) => {
      const response = await apiRequest("PATCH", `/api/todos/${id}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">To-Dos</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="note-card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeTodos = todos?.filter(todo => !todo.completed) || [];
  const completedTodos = todos?.filter(todo => todo.completed) || [];

  if (!todos || todos.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">To-Dos</h2>
          <span className="text-sm text-[hsl(var(--ios-gray))]">0 active</span>
        </div>
        <div className="text-center py-8">
          <p className="text-[hsl(var(--ios-gray))]">No to-dos yet. They'll appear here when AI extracts them from your notes!</p>
        </div>
      </div>
    );
  }

  const handleToggleTodo = (todo: Todo) => {
    toggleTodoMutation.mutate({
      id: todo.id,
      completed: !todo.completed,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">To-Dos</h2>
        <span className="text-sm text-[hsl(var(--ios-gray))]">{activeTodos.length} active</span>
      </div>

      <div className="space-y-4">
        {activeTodos.map((todo) => (
          <div key={todo.id} className="note-card">
            <div className="flex items-start space-x-3">
              <button 
                onClick={() => handleToggleTodo(todo)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors ${
                  todo.completed 
                    ? "border-[hsl(var(--ios-green))] bg-[hsl(var(--ios-green))]"
                    : "border-[hsl(var(--ios-gray))]"
                }`}
              >
                {todo.completed && <Check className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1">
                <p className={`text-base ${todo.completed ? "line-through text-[hsl(var(--ios-gray))]" : ""}`}>
                  {todo.title}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-[hsl(var(--ios-gray))]">From note</span>
                  <ExternalLink className="w-3 h-3 text-[hsl(var(--ios-gray))]" />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {completedTodos.length > 0 && (
          <>
            <div className="mt-8 mb-4">
              <h3 className="text-lg font-semibold text-[hsl(var(--ios-gray))]">Completed</h3>
            </div>
            {completedTodos.map((todo) => (
              <div key={todo.id} className="note-card opacity-60">
                <div className="flex items-start space-x-3">
                  <button 
                    onClick={() => handleToggleTodo(todo)}
                    className="w-6 h-6 rounded-full border-2 border-[hsl(var(--ios-green))] bg-[hsl(var(--ios-green))] flex items-center justify-center mt-0.5"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </button>
                  <div className="flex-1">
                    <p className="text-base line-through text-[hsl(var(--ios-gray))]">
                      {todo.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-[hsl(var(--ios-gray))]">From note</span>
                      <ExternalLink className="w-3 h-3 text-[hsl(var(--ios-gray))]" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
