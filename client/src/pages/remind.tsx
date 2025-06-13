import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Check, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import SimpleTextInput from "@/components/simple-text-input";
import { formatDistanceToNow } from "date-fns";
import type { Todo } from "@shared/schema";

export default function Remind() {
  const [reminderFilter, setReminderFilter] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [todoFilter, setTodoFilter] = useState<'all' | 'urgent' | 'pinned'>('all');
  const [inputText, setInputText] = useState('');

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

  const formatRelativeTime = (date: Date | string | null) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return '';
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
                      className="text-gray-400"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium truncate ${
                          reminder.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {reminder.title}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-orange-600 ml-2">
                          {reminder.timeDue && (
                            <span>{formatRelativeTime(reminder.timeDue)}</span>
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
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">Loading todos...</div>
              ) : filteredTodos.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No todos found</div>
              ) : (
                filteredTodos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 py-1">
                    <button 
                      onClick={() => toggleCompletionMutation.mutate(todo)}
                      className="text-gray-400"
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
                          {todo.timeDue && (
                            <span>{formatRelativeTime(todo.timeDue)}</span>
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

        {/* Floating Input Bar - Voice Only */}
        <SimpleTextInput 
          onTextSubmit={(text) => processInputMutation.mutate(text)}
          placeholder="Add/edit to-do's + reminders..."
          context="remind"
          showCamera={false}
          showMediaPicker={false}
        />

        <BottomNavigation />
      </div>
    </div>
  );
}