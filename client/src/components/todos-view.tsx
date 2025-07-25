import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Todo } from "@shared/schema";
import { Check, Pin, Archive, Clock, AlertCircle, Star, Filter, ChevronDown, ChevronRight, Circle, Search, Mic, Copy, Trash2, MoreHorizontal, X, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

type FilterType = 'all' | 'urgent' | 'today' | 'pinned' | 'completed' | 'archived';
type ReminderFilterType = 'today' | 'week' | 'month' | 'year';

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
        className={`flex items-center gap-2 py-0 px-4 border-b border-gray-100 dark:border-gray-800 transition-all duration-200 cursor-pointer relative
          ${todo.completed 
            ? 'text-gray-500 dark:text-gray-400' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
          }
          ${todo.pinned ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
        `}
        onClick={handleClick}
      >
        {/* Vertical grouping line - positioned right of circle, before text */}
        <div className="absolute left-[56px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(todo);
          }}
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors touch-manipulation
            ${todo.completed 
              ? 'text-white' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-600'
            }
          `}
        >
          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${todo.completed 
              ? 'bg-green-500 border-green-500 text-white' 
              : 'border-gray-300 dark:border-gray-600'
            }
          `}>
            {todo.completed && <Check size={12} />}
          </div>
        </button>

        <div className="flex-grow min-w-0">
          <p className={`text-sm ${todo.completed ? 'line-through' : ''} truncate`}>
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
  const [activeReminderFilter, setActiveReminderFilter] = useState<ReminderFilterType>('today');
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
    onMutate: async ({ id, completed }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/todos"] });
      
      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData<Todo[]>(["/api/todos"]);
      
      // Optimistically update to the new value
      queryClient.setQueryData<Todo[]>(["/api/todos"], (old) =>
        old?.map(todo => 
          todo.id === id ? { ...todo, completed } : todo
        ) || []
      );
      
      return { previousTodos };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        queryClient.setQueryData(["/api/todos"], context.previousTodos);
      }
    },
    onSettled: () => {
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
    { key: 'pinned', label: 'Pins', count: pinnedCount, icon: Pin },
    { key: 'urgent', label: 'Urgent', count: urgentCount, icon: AlertCircle },
    { key: 'completed', label: 'Done', count: todos?.filter(t => t.completed && !t.archived).length || 0, icon: Check },
  ];

  // Separate reminders and todos
  const reminders = todos?.filter(t => t.isActiveReminder && !t.completed && !t.archived) || [];
  const regularTodos = todos?.filter(t => !t.isActiveReminder && !t.completed && !t.archived) || [];

  return (
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

      {/* Reminders Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Reminders</h3>
          <div className="flex gap-1">
            {(['today', 'week', 'month', 'year'] as ReminderFilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveReminderFilter(filter)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  activeReminderFilter === filter
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {reminders.length > 0 ? (
          <div className="space-y-2">
            {reminders.map(reminder => (
              <TodoItem
                key={reminder.id}
                todo={reminder}
                onToggle={handleToggleTodo}
                onPin={handlePinTodo}
                onArchive={handleArchiveTodo}
                onClick={handleTodoClick}
              />
            ))}
          </div>
        ) : (
          <div className="px-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              None {activeReminderFilter === 'today' ? 'today' : 
                    activeReminderFilter === 'week' ? 'this week' :
                    activeReminderFilter === 'month' ? 'this month' :
                    'this year'}
            </p>
          </div>
        )}
      </div>

      {/* To-dos Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">To-dos</h3>
          <div className="flex gap-1">
            {filterButtons.map(({ key, label, count, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveFilter(key as FilterType)}
                className={`px-2 py-1 text-xs rounded-md transition-colors whitespace-nowrap flex-shrink-0
                  ${activeFilter === key
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredTodos.length > 0 ? (
          <div className="space-y-2">
            {filteredTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onPin={handlePinTodo}
                onArchive={handleArchiveTodo}
                onClick={handleTodoClick}
              />
            ))}
          </div>
        ) : (
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
    </div>
  );
}