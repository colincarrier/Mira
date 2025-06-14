import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Check, Plus, Edit2, Calendar, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import SimpleTextInput from "@/components/simple-text-input";
import { ReminderDialog } from "@/components/reminder-dialog";
import { formatDistanceToNow } from "date-fns";
import type { Todo } from "@shared/schema";

export default function Remind() {
  const [reminderFilter, setReminderFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [todoFilter, setTodoFilter] = useState<'all' | 'urgent' | 'pinned'>('all');
  const [inputText, setInputText] = useState('');
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Todo | null>(null);

  const queryClient = useQueryClient();

  // Fetch all todos - we'll filter client-side
  const { data: allTodos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Intelligent input processing - creates note and extracts todos/reminders with AI
  const processInputMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content,
          mode: 'text',
          context: 'remind_page_input'
        })
      });
      if (!response.ok) throw new Error('Failed to process input');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notes"] });
      setInputText('');
    }
  });

  // Toggle completion for any todo/reminder
  const toggleCompletionMutation = useMutation({
    mutationFn: async (todo: Todo) => {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          completed: !todo.completed,
          reminderState: !todo.completed ? 'completed' : 'active'
        })
      });
      if (!response.ok) throw new Error('Failed to update todo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    }
  });

  // Navigate to source note
  const handleItemClick = (todo: Todo) => {
    if (todo.noteId) {
      window.location.href = `/notes/${todo.noteId}`;
    }
  };

  // Dialog handlers
  const handleClockClick = (reminder: Todo) => {
    setEditingReminder(reminder);
    setReminderDialogOpen(true);
  };

  const handleReminderUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
    setEditingReminder(null);
  };

  // Client-side filtering
  const reminders = allTodos.filter(todo => todo.isActiveReminder === true && !todo.archived);
  const todos = allTodos.filter(todo => todo.isActiveReminder === false && !todo.archived);

  // Apply additional filters
  const filteredReminders = reminders.filter(reminder => {
    // For now, show all reminders regardless of time filter
    // Future: implement proper time-based filtering
    return true;
  });

  const filteredTodos = todos.filter(todo => {
    if (todoFilter === 'all') return true;
    if (todoFilter === 'urgent') return todo.priority === 'urgent';
    if (todoFilter === 'pinned') return todo.pinned;
    return true;
  });

  // Work-day-aware smart urgency system
  const getSmartTimeDisplay = (date: Date | string | null, filterContext: 'today' | 'week' | 'month' | 'year') => {
    if (!date) return null;

    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = targetDate.getTime() - now.getTime();

    const diffMinutes = Math.floor(Math.abs(diffMs) / (1000 * 60));
    const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

    // Helper: Get work days between dates (excludes weekends)
    const getWorkDaysBetween = (start: Date, end: Date): number => {
      let count = 0;
      const current = new Date(start);
      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // Not Sunday or Saturday
        current.setDate(current.getDate() + 1);
      }
      return count;
    };

    // Helper: Is same work day?
    const isSameWorkDay = (date1: Date, date2: Date): boolean => {
      return date1.toDateString() === date2.toDateString();
    };

    // If time has passed (overdue)
    if (diffMs < 0) {
      // Still same work day - show as overdue with red styling
      if (isSameWorkDay(now, targetDate)) {
        if (diffMinutes < 60) {
          return { text: `${diffMinutes}m ago`, color: 'text-red-600', bgColor: 'bg-red-50' };
        } else {
          return { text: `${diffHours}h ago`, color: 'text-red-600', bgColor: 'bg-red-50' };
        }
      }
      // Past work day - will be filtered to overdue section
      return null;
    }

    // Future items - work-day-aware urgency thresholds
    const workDaysAway = getWorkDaysBetween(now, targetDate);

    // Smart thresholds based on filter context and work days
    const urgencyThresholds = {
      today: diffHours < 2,                    // Show if < 2 hours
      week: workDaysAway <= 1,                 // Show if within 1 work day
      month: workDaysAway <= 4,                // Show if within 4 work days  
      year: workDaysAway <= 10                 // Show if within 2 work weeks
    };

    if (!urgencyThresholds[filterContext]) return null;

    // Format the urgent time display
    if (diffMinutes < 60) {
      return { text: `in ${diffMinutes}m`, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    } else if (diffHours < 24) {
      return { text: `in ${diffHours}h`, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    } else if (workDaysAway <= 1) {
      return { text: `in 1d`, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    } else {
      return { text: `in ${workDaysAway}d`, color: 'text-orange-600', bgColor: 'bg-orange-50' };
    }
  };

  const handleSubmitInput = () => {
    if (inputText.trim()) {
      processInputMutation.mutate(inputText.trim());
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
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">Loading reminders...</div>
              ) : filteredReminders.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No reminders found</div>
              ) : (
                filteredReminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-3 py-1">
                    <button 
                      onClick={() => toggleCompletionMutation.mutate(reminder)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        reminder.completed
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-gray-300 hover:border-orange-400'
                      }`}
                    >
                      {reminder.completed && <Check className="w-3 h-3" />}
                    </button>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleItemClick(reminder)}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium truncate ${
                          reminder.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {reminder.title}
                        </span>
                        <div className="flex items-center gap-1 text-xs ml-2">
                          {reminder.timeDue && (() => {
                            const timeDisplay = getSmartTimeDisplay(reminder.timeDue, reminderFilter);
                            return timeDisplay && (
                              <span className={`${timeDisplay.color} font-medium px-1 py-0.5 ${timeDisplay.bgColor} rounded`}>
                                {timeDisplay.text}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClockClick(reminder);
                      }}
                      className="p-1 text-orange-500 hover:text-orange-700 transition-colors"
                    >
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
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">Loading todos...</div>
              ) : filteredTodos.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No todos found</div>
              ) : (
                filteredTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 py-1">
                    <button 
                      onClick={() => toggleCompletionMutation.mutate(todo)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        todo.completed
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {todo.completed && <Check className="w-3 h-3" />}
                    </button>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleItemClick(todo)}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium truncate ${
                          todo.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {todo.title}
                        </span>
                        <div className="flex items-center gap-1 text-xs ml-2">
                          {todo.timeDue && (() => {
                            const timeDisplay = getSmartTimeDisplay(todo.timeDue, 'today');
                            return timeDisplay && (
                              <span className={`${timeDisplay.color} font-medium px-1 py-0.5 ${timeDisplay.bgColor} rounded`}>
                                {timeDisplay.text}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClockClick(todo);
                      }}
                      className={`p-1 transition-colors ${
                        todo.timeDue || todo.isActiveReminder 
                          ? 'text-blue-500 hover:text-blue-700' 
                          : 'text-gray-300 hover:text-gray-400 opacity-50'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Floating Input Bar - Context Aware */}
        <InputBar 
          onTextSubmit={(text) => processInputMutation.mutate(text)}
        />

        <BottomNavigation />

        {/* Reminder Dialog */}
        <ReminderDialog
          open={reminderDialogOpen}
          onOpenChange={setReminderDialogOpen}
          existingReminder={editingReminder}
          onReminderUpdated={handleReminderUpdated}
        />
      </div>
    </div>
  );
}