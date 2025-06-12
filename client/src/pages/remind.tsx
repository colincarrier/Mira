import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, CheckCircle, X, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/bottom-navigation";
import { useToast } from "@/hooks/use-toast";

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
}

export default function Remind() {
  const [reminderFilter, setReminderFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const [todoFilter, setTodoFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newReminder, setNewReminder] = useState('');
  const [newTodo, setNewTodo] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reminders
  const { data: reminders = [], isLoading: remindersLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  // Fetch todos
  const { data: todos = [], isLoading: todosLoading } = useQuery<Todo[]>({
    queryKey: ["/api/todos"],
  });

  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to create reminder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setNewReminder('');
      toast({
        title: "Reminder created",
        description: "Your reminder has been created successfully."
      });
    }
  });

  // Create todo mutation
  const createTodoMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: content, completed: false })
      });
      if (!response.ok) throw new Error('Failed to create todo');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/todos"] });
      setNewTodo('');
      toast({
        title: "Todo created",
        description: "Your todo has been created successfully."
      });
    }
  });

  // Toggle reminder state
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

  const handleAddReminder = () => {
    if (newReminder.trim()) {
      createReminderMutation.mutate(newReminder.trim());
    }
  };

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      createTodoMutation.mutate(newTodo.trim());
    }
  };

  // Filter reminders
  const filteredReminders = reminders.filter(reminder => {
    if (reminderFilter === 'all') return true;
    return reminder.reminderState === reminderFilter;
  });

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    if (todoFilter === 'all') return true;
    if (todoFilter === 'active') return !todo.completed;
    if (todoFilter === 'completed') return todo.completed;
    return true;
  });

  const formatDueDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'overdue':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Overdue</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Completed</span>;
      case 'active':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Active</span>;
      default:
        return null;
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
                <Clock className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Reminders</h3>
              </div>
              <span className="text-sm text-gray-500">{filteredReminders.length}</span>
            </div>

            {/* Reminder Input */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add a reminder..."
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddReminder()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddReminder}
                disabled={!newReminder.trim() || createReminderMutation.isPending}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Reminder Filters */}
            <div className="flex gap-2 mb-4">
              {(['all', 'active', 'overdue', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setReminderFilter(filter)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    reminderFilter === filter
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Reminders List */}
            <div className="space-y-2">
              {remindersLoading ? (
                <div className="text-center py-4 text-gray-500">Loading reminders...</div>
              ) : filteredReminders.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No reminders found</div>
              ) : (
                filteredReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleReminderMutation.mutate(reminder)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          reminder.reminderState === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {reminder.reminderState === 'completed' && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          reminder.reminderState === 'completed' 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {reminder.title}
                        </div>
                        {reminder.dueDate && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDueDate(reminder.dueDate)}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(reminder.reminderState)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Todos Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between px-0 mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">To-Do's</h3>
              </div>
              <span className="text-sm text-gray-500">{filteredTodos.length}</span>
            </div>

            {/* Todo Input */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add a todo..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddTodo}
                disabled={!newTodo.trim() || createTodoMutation.isPending}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Todo Filters */}
            <div className="flex gap-2 mb-4">
              {(['all', 'active', 'completed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTodoFilter(filter)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    todoFilter === filter
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Todos List */}
            <div className="space-y-2">
              {todosLoading ? (
                <div className="text-center py-4 text-gray-500">Loading todos...</div>
              ) : filteredTodos.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No todos found</div>
              ) : (
                filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleTodoMutation.mutate(todo)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          todo.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {todo.completed && (
                          <CheckCircle className="w-3 h-3" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className={`font-medium ${
                          todo.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {todo.title}
                        </div>
                        {todo.dueDate && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDueDate(todo.dueDate)}
                          </div>
                        )}
                      </div>
                    </div>
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