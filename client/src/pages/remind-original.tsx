import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Plus, CheckCircle, X } from "lucide-react";
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

export default function Remind() {
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const [newReminder, setNewReminder] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reminders
  const { data: reminders = [], isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
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

  // Complete reminder mutation
  const completeReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/reminders/${id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to complete reminder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Reminder completed",
        description: "The reminder has been marked as complete."
      });
    }
  });

  // Dismiss reminder mutation
  const dismissReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/reminders/${id}/dismiss`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to dismiss reminder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Reminder dismissed",
        description: "The reminder has been dismissed."
      });
    }
  });

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReminder.trim()) {
      createReminderMutation.mutate(newReminder.trim());
    }
  };

  const formatDueTime = (dueDate?: Date) => {
    if (!dueDate) return null;
    
    const date = new Date(dueDate);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    const timeString = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    
    if (isToday) return `Today at ${timeString}`;
    if (isTomorrow) return `Tomorrow at ${timeString}`;
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const filteredReminders = reminders?.filter(reminder => {
    if (filter === 'all') return true;
    if (filter === 'active') return reminder.reminderState === 'active';
    if (filter === 'overdue') return reminder.reminderState === 'overdue';
    if (filter === 'completed') return reminder.reminderState === 'completed';
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Reminders</h1>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white border-b px-4 py-3">
        <form onSubmit={handleCreateReminder} className="flex gap-2">
          <Input
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            placeholder="Add a reminder..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!newReminder.trim() || createReminderMutation.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b px-4 py-2">
        <div className="flex space-x-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'overdue', label: 'Overdue' },
            { key: 'completed', label: 'Completed' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === key
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-lg border p-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4">
            <Clock className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reminders</h3>
            <p className="text-gray-500 text-center">
              {filter === 'all' ? 'Add your first reminder above' : `No ${filter} reminders to show`}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredReminders.map((reminder) => (
              <div 
                key={reminder.id} 
                className="bg-white rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 mb-1">{reminder.title}</div>
                    {reminder.dueDate && (
                      <div className="text-sm text-gray-500">
                        {formatDueTime(reminder.dueDate)}
                      </div>
                    )}
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        reminder.reminderState === 'active' ? 'bg-blue-100 text-blue-800' :
                        reminder.reminderState === 'overdue' ? 'bg-red-100 text-red-800' :
                        reminder.reminderState === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {reminder.reminderState}
                      </span>
                    </div>
                  </div>
                  
                  {reminder.reminderState === 'active' && (
                    <div className="flex gap-1 ml-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => completeReminderMutation.mutate(reminder.id)}
                        disabled={completeReminderMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissReminderMutation.mutate(reminder.id)}
                        disabled={dismissReminderMutation.isPending}
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}