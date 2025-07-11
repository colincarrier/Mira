import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { Check, Pin, Archive, Clock, AlertCircle, Star, Filter, ChevronDown, ChevronRight, Circle, Search, Mic, Copy, Trash2, MoreHorizontal, X, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

type FilterType = 'all' | 'urgent' | 'today' | 'pinned' | 'completed' | 'archived';

interface TodoItemProps {
  todo: Todo;
  onToggle: (todo: Todo) => void;
  onPin: (todo: Todo) => void;
  onArchive: (todo: Todo) => void;
  onDragStart?: (todo: Todo) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  onClick?: (todo: Todo) => void;
}

function TodoItem({ todo, onToggle, onPin, onArchive, onDragStart, onDragEnd, isDragging: isExternalDragging, onClick }: TodoItemProps) {
  const [showSwipeMenu, setShowSwipeMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useState<NodeJS.Timeout | null>(null);

  const handleDuplicate = () => {
    console.log('Duplicate todo:', todo.id);
    setShowSwipeMenu(false);
  };

  const handleDelete = () => {
    console.log('Delete todo:', todo.id);
    setShowSwipeMenu(false);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(todo);
    }
  };

  return (
    <div className="relative">
      <div 
        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer
          ${todo.completed 
            ? 'bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400' 
            : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
          }
          ${isDragging || isExternalDragging ? 'shadow-lg scale-105' : 'shadow-sm'}
          ${todo.pinned ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}
        `}
        onClick={handleClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(todo);
          }}
          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
            ${todo.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
            }
          `}
        >
          {todo.completed && <Check size={12} />}
        </button>

        <div className="flex-grow min-w-0">
          <p className={`text-sm ${todo.completed ? 'line-through' : ''}`}>
            {todo.title}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {todo.pinned && (
            <Pin size={14} className="text-blue-500 dark:text-blue-400" />
          )}
          
          {todo.priority === 'urgent' && !todo.completed && (
            <AlertCircle size={14} className="text-red-500 dark:text-red-400" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function TodosView() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
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

  // Group todos by their related notes/projects
  const groupTodosByNote = (todos: Todo[]) => {
    const grouped: { [key: string]: { noteTitle: string; todos: Todo[] } } = {};
    
    todos.forEach(todo => {
      const noteTitle = (todo as any).noteTitle || 'Other Tasks';
      const groupKey = `note_${todo.noteId || 'orphaned'}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          noteTitle: noteTitle,
          todos: []
        };
      }
      
      grouped[groupKey].todos.push(todo);
    });
    
    return grouped;
  };

  const getFilteredTodos = () => {
    if (!todos) return [];

    let filtered = todos.filter(t => {
      const matchesSearch = !searchTerm || t.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    switch (activeFilter) {
      case 'pinned':
        return filtered.filter(t => t.pinned && !t.completed && !t.archived);
      case 'urgent':
        return filtered.filter(t => t.priority === 'urgent' && !t.completed && !t.archived);
      case 'today':
        return filtered.filter(t => !t.completed && !t.archived);
      case 'completed':
        return filtered.filter(t => t.completed && !t.archived);
      case 'archived':
        return filtered.filter(t => t.archived);
      default:
        return showArchived ? filtered : filtered.filter(t => !t.archived);
    }
  };

  const handleToggleTodo = (todo: Todo) => {
    toggleTodoMutation.mutate({ id: todo.id, completed: !todo.completed });
  };

  const handlePinTodo = (todo: Todo) => {
    pinTodoMutation.mutate({ id: todo.id, pinned: !todo.pinned });
  };

  const handleArchiveTodo = (todo: Todo) => {
    archiveTodoMutation.mutate({ id: todo.id, archived: !todo.archived });
  };

  const handleTodoClick = (todo: Todo) => {
    setLocation(`/todos/${todo.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredTodos = getFilteredTodos();
  const activeTodos = todos?.filter(t => !t.completed && !t.archived) || [];
  const pinnedCount = todos?.filter(t => t.pinned && !t.completed && !t.archived).length || 0;
  const urgentCount = todos?.filter(t => t.priority === 'urgent' && !t.completed && !t.archived).length || 0;
  
  // Group todos by note for better organization
  const groupedTodos = groupTodosByNote(filteredTodos);

  const filterButtons = [
    { key: 'all', label: 'All', count: activeTodos.length, icon: null },
    { key: 'pinned', label: 'Pinned', count: pinnedCount, icon: Pin },
    { key: 'urgent', label: 'Urgent', count: urgentCount, icon: AlertCircle },
    { key: 'completed', label: 'Done', count: todos?.filter(t => t.completed && !t.archived).length || 0, icon: Check },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tasks
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

      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterButtons.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key as FilterType)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
              ${activeFilter === key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {Icon && <Icon size={14} />}
            {label}
            {count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs
                ${activeFilter === key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }
              `}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {Object.entries(groupedTodos).map(([groupKey, group]) => (
          <div key={groupKey} className="space-y-2">
            {Object.keys(groupedTodos).length > 1 && (
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 px-1">
                {group.noteTitle}
              </h3>
            )}
            <div className="space-y-2">
              {group.todos.map(todo => (
                <div key={todo.id} className={Object.keys(groupedTodos).length > 1 ? 'ml-4' : ''}>
                  <TodoItem
                    todo={todo}
                    onToggle={handleToggleTodo}
                    onPin={handlePinTodo}
                    onArchive={handleArchiveTodo}
                    onClick={handleTodoClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredTodos.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <Circle size={48} className="mx-auto mb-4 opacity-50" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            {activeFilter === 'completed' ? 'No completed tasks yet' : 
             activeFilter === 'pinned' ? 'No pinned tasks' :
             activeFilter === 'urgent' ? 'No urgent tasks' :
             searchTerm ? 'No tasks found' : 'No tasks yet'}
          </p>
        </div>
      )}
    </div>
  );
}