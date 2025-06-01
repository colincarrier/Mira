import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { Check, Pin, Archive, Clock, AlertCircle, Star, Filter, ChevronDown, ChevronRight, Circle, Search, Mic } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type FilterType = 'all' | 'urgent' | 'today' | 'pinned' | 'completed' | 'archived';

export default function TodosView() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
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

  const pinTodoMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: number; pinned: boolean }) => {
      const response = await apiRequest("PATCH", `/api/todos/${id}`, { pinned });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const archiveTodoMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: number; archived: boolean }) => {
      const response = await apiRequest("PATCH", `/api/todos/${id}`, { archived });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    },
  });

  const getFilteredTodos = () => {
    if (!todos) return [];
    
    let filtered = todos;
    
    // Apply search filter first
    if (searchTerm) {
      filtered = filtered.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    switch (activeFilter) {
      case 'pinned':
        filtered = filtered.filter(t => t.pinned && !t.completed && !t.archived);
        break;
      case 'urgent':
        filtered = filtered.filter(t => t.priority === 'urgent' && !t.completed && !t.archived);
        break;
      case 'today':
        // Simple heuristic: recently created todos
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(t => new Date(t.createdAt) >= today && !t.completed && !t.archived);
        break;
      case 'completed':
        filtered = filtered.filter(t => t.completed && !t.archived);
        break;
      case 'archived':
        filtered = filtered.filter(t => t.archived);
        break;
      default:
        filtered = filtered.filter(t => !t.archived);
    }
    
    // Organize todos with pinned at top, then urgent, then others
    if (activeFilter === 'all') {
      const pinned = filtered.filter(t => t.pinned && !t.completed);
      const urgent = filtered.filter(t => t.priority === 'urgent' && !t.pinned && !t.completed);
      const regular = filtered.filter(t => !t.pinned && t.priority !== 'urgent' && !t.completed);
      const completed = filtered.filter(t => t.completed);
      return [...pinned, ...urgent, ...regular, ...completed];
    }
    
    return filtered;
  };

  const handleToggleTodo = (todo: Todo) => {
    toggleTodoMutation.mutate({
      id: todo.id,
      completed: !todo.completed,
    });
  };

  const handlePinTodo = (todo: Todo) => {
    pinTodoMutation.mutate({
      id: todo.id,
      pinned: !todo.pinned,
    });
  };

  const handleArchiveTodo = (todo: Todo) => {
    archiveTodoMutation.mutate({
      id: todo.id,
      archived: !todo.archived,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Tasks</h2>
        </div>
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-[hsl(var(--muted))] rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const filteredTodos = getFilteredTodos();
  const activeTodos = todos?.filter(t => !t.completed && !t.archived) || [];
  const pinnedCount = todos?.filter(t => t.pinned && !t.completed && !t.archived).length || 0;
  const urgentCount = todos?.filter(t => t.priority === 'urgent' && !t.completed && !t.archived).length || 0;

  const filterButtons = [
    { key: 'all', label: 'All', count: activeTodos.length, icon: null },
    { key: 'pinned', label: 'Pinned', count: pinnedCount, icon: Pin },
    { key: 'urgent', label: 'Urgent', count: urgentCount, icon: AlertCircle },
    { key: 'completed', label: 'Done', count: todos?.filter(t => t.completed && !t.archived).length || 0, icon: Check },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          {showArchived ? 'Hide' : 'Archive'}
        </button>
      </div>

      {/* Compact Filter Tabs */}
      <div className="flex space-x-1 p-1 bg-[hsl(var(--muted))] rounded-lg">
        {filterButtons.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key as FilterType)}
            className={`flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
              activeFilter === filter.key
                ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {filter.icon && <filter.icon className="w-3 h-3" />}
            <span>{filter.label}</span>
            {filter.count > 0 && (
              <span className="ml-1 text-xs px-1 py-0.5 bg-[hsl(var(--soft-sky-blue))] text-[hsl(var(--foreground))] rounded">
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Compact Todo List */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-4 text-[hsl(var(--muted-foreground))] text-sm">
            {activeFilter === 'all' ? 'No tasks yet' : `No ${activeFilter} tasks`}
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {activeFilter === 'all' && filteredTodos.some(t => t.pinned && !t.completed) && (
              <div>
                <h3 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1">
                  <Pin className="w-3 h-3" />
                  Pinned
                </h3>
                <div className="space-y-1">
                  {filteredTodos.filter(t => t.pinned && !t.completed).map((todo) => (
                    <TodoItem key={todo.id} todo={todo} onToggle={handleToggleTodo} onPin={handlePinTodo} onArchive={handleArchiveTodo} />
                  ))}
                </div>
              </div>
            )}

            {/* Urgent Section */}
            {activeFilter === 'all' && filteredTodos.some(t => t.priority === 'urgent' && !t.pinned && !t.completed) && (
              <div>
                <h3 className="text-xs font-semibold text-[#8B2635] mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Urgent
                </h3>
                <div className="space-y-1">
                  {filteredTodos.filter(t => t.priority === 'urgent' && !t.pinned && !t.completed).map((todo) => (
                    <TodoItem key={todo.id} todo={todo} onToggle={handleToggleTodo} onPin={handlePinTodo} onArchive={handleArchiveTodo} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Tasks */}
            {activeFilter === 'all' && filteredTodos.some(t => !t.pinned && t.priority !== 'urgent' && !t.completed) && (
              <div>
                <h3 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">Tasks</h3>
                <div className="space-y-1">
                  {filteredTodos.filter(t => !t.pinned && t.priority !== 'urgent' && !t.completed).map((todo) => (
                    <TodoItem key={todo.id} todo={todo} onToggle={handleToggleTodo} onPin={handlePinTodo} onArchive={handleArchiveTodo} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {activeFilter === 'all' && filteredTodos.some(t => t.completed) && (
              <div>
                <h3 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Completed
                </h3>
                <div className="space-y-1">
                  {filteredTodos.filter(t => t.completed).map((todo) => (
                    <TodoItem key={todo.id} todo={todo} onToggle={handleToggleTodo} onPin={handlePinTodo} onArchive={handleArchiveTodo} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Filters */}
            {activeFilter !== 'all' && filteredTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggle={handleToggleTodo} onPin={handlePinTodo} onArchive={handleArchiveTodo} />
            ))}
          </>
        )}
      </div>

      {/* Archived Section */}
      {showArchived && (
        <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]">
          <div className="flex items-center space-x-2 mb-2">
            <Archive className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Archived ({todos?.filter(t => t.archived).length || 0})
            </span>
          </div>
          <div className="space-y-1">
            {todos?.filter(t => t.archived).map((todo) => (
              <div key={todo.id} className="flex items-center space-x-2 p-1 text-xs text-[hsl(var(--muted-foreground))]">
                <Circle className="w-3 h-3" />
                <span className="flex-1 truncate">{todo.title}</span>
                <button
                  onClick={() => handleArchiveTodo(todo)}
                  className="hover:text-[hsl(var(--foreground))]"
                  title="Unarchive"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mt-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search todos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm"
          />
          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-[hsl(var(--ocean-blue))] rounded-full flex items-center justify-center">
            <Mic className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}