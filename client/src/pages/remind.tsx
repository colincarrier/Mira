import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Check } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";
import { formatDistanceToNow } from "date-fns";

interface Reminder {
  id: number;
  title: string;
  dueDate?: Date;
  reminderState: 'active' | 'overdue' | 'completed' | 'dismissed' | 'archived';
  priority?: string;
  reminderType?: string;
}

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  dueDate?: Date;
  priority?: string;
  pinned?: boolean;
}

export default function Remind() {
  const [reminderFilter, setReminderFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [todoFilter, setTodoFilter] = useState<'all' | 'urgent' | 'pinned'>('all');
  
  const queryClient = useQueryClient();

  // Fetch reminders
  const { data: reminders = [], isLoading: remindersLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  // Fetch todos
  const { data: todos = [], isLoading: todosLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Toggle reminder completion
  const toggleReminderMutation = useMutation({
    mutationFn: async (reminder: Reminder) => {
      const newState = reminder.reminderState === 'completed' ? 'active' : 'completed';
      const response = await fetch(`/api/reminders/${reminder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderState: newState })
      });
      if (!response.ok) throw new Error('Failed to update reminder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
    }
  });

  // Toggle todo completion
  const toggleTodoMutation = useMutation({
    mutationFn: async (todo: Todo) => {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed })
      });
      if (!response.ok) throw new Error('Failed to update todo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    }
  });

  // Filter reminders based on time period
  const filteredReminders = reminders.filter(reminder => {
    // For now, show all reminders regardless of filter
    return reminder.reminderState === 'active' || reminder.reminderState === 'overdue';
  });

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    if (todoFilter === 'all') return true;
    if (todoFilter === 'urgent') return todo.priority === 'high' || todo.priority === 'urgent';
    if (todoFilter === 'pinned') return todo.pinned;
    return true;
  });

  const formatRelativeTime = (date: Date | undefined) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-[#f1efe8]">
      <div className="w-full bg-[hsl(var(--background))] min-h-screen relative">
        <div className="safe-area-top bg-[hsl(var(--background))]"></div>
        <div className="pb-24 px-4">
          {/* Header */}
          <div className="pt-6 mb-6">
            <h2 className="text-2xl font-serif font-medium text-gray-900 dark:text-gray-100">Remind</h2>
          </div>

          {/* Reminders Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between px-0 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Reminders</h3>
                <span className="text-sm text-gray-500">({filteredReminders.length})</span>
              </div>
              <div className="flex gap-1">
                {(['today', 'week', 'month', 'year'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setReminderFilter(filter)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      reminderFilter === filter
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Reminders List */}
            <div className="space-y-1">
              {remindersLoading ? (
                <div className="text-center py-4 text-gray-500">Loading reminders...</div>
              ) : filteredReminders.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No reminders found</div>
              ) : (
                filteredReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-3 py-1">
                    <button 
                      onClick={() => toggleReminderMutation.mutate(reminder)}
                      className="text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                          {reminder.title}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-orange-600 ml-2">
                          {reminder.dueDate && (
                            <span>{formatRelativeTime(reminder.dueDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="p-1 text-orange-500 hover:text-orange-700 transition-colors">
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* To-do's Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between px-0 mb-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">To-do's</h3>
                <span className="text-sm text-gray-500">({filteredTodos.length})</span>
              </div>
              <div className="flex gap-1">
                {(['all', 'urgent', 'pinned'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTodoFilter(filter)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      todoFilter === filter
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Todos List */}
            <div className="space-y-1">
              {todosLoading ? (
                <div className="text-center py-4 text-gray-500">Loading todos...</div>
              ) : filteredTodos.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No todos found</div>
              ) : (
                filteredTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 py-1">
                    <button 
                      onClick={() => toggleTodoMutation.mutate(todo)}
                      className="text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium truncate ${
                          todo.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {todo.title}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-blue-600 ml-2">
                          {todo.dueDate && (
                            <span>{formatRelativeTime(todo.dueDate)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button className="p-1 text-blue-500 hover:text-blue-700 transition-colors">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <BottomNavigation />
      </div>
    </div>
  );
}