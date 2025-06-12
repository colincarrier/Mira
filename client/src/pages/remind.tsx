import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Calendar, CheckCircle, Archive, AlertCircle, Filter, Plus, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReminderInput } from "@/components/reminder-input";
import BottomNavigation from "@/components/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

interface Reminder {
  id: number;
  title: string;
  dueDate?: Date;
  reminderState: 'active' | 'overdue' | 'completed' | 'dismissed' | 'archived';
  priority?: string;
  reminderType?: string;
}

export default function Remind() {
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('active');
  const [showCreateReminder, setShowCreateReminder] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reminders
  const { data: reminders, isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders", filter === 'all' ? undefined : filter],
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

  // Archive reminder mutation
  const archiveReminderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/reminders/${id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to archive reminder');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Reminder archived",
        description: "The reminder has been archived."
      });
    }
  });

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

  const getStateColor = (state: string) => {
    switch (state) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'dismissed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReminders = reminders?.filter(reminder => {
    if (filter === 'all') return true;
    if (filter === 'active') return reminder.reminderState === 'active';
    if (filter === 'overdue') return reminder.reminderState === 'overdue';
    if (filter === 'completed') return reminder.reminderState === 'completed';
    return true;
  }) || [];

  const activeCount = reminders?.filter(r => r.reminderState === 'active').length || 0;
  const overdueCount = reminders?.filter(r => r.reminderState === 'overdue').length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-semibold">Reminders</h1>
          <Button 
            onClick={() => setShowCreateReminder(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 bg-background border-b">
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
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Create Reminder Dialog */}
      <Dialog open={showCreateReminder} onOpenChange={setShowCreateReminder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Reminder</DialogTitle>
          </DialogHeader>
          <ReminderInput
            onReminderCreated={(reminder) => {
              setShowCreateReminder(false);
              queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
            }}
          />
          <DialogClose asChild>
            <Button variant="outline" className="mt-4">
              Cancel
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-4">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reminders</h3>
            <p className="text-muted-foreground text-center mb-4">
              {filter === 'active' ? 'Create your first reminder to get started' : 
               `No ${filter} reminders to show`}
            </p>
            <Button onClick={() => setShowCreateReminder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Reminder
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredReminders.map((reminder) => (
              <div 
                key={reminder.id} 
                className="flex items-center justify-between p-3 bg-card rounded-lg border cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setSelectedReminder(reminder)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{reminder.title}</div>
                  {reminder.dueDate && (
                    <div className="text-sm text-muted-foreground">
                      {formatDueTime(reminder.dueDate)}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-3">
                  <Badge variant={reminder.reminderState === 'active' ? 'default' : 'secondary'}>
                    {reminder.reminderState}
                  </Badge>
                  
                  {reminder.reminderState === 'active' && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          completeReminderMutation.mutate(reminder.id);
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissReminderMutation.mutate(reminder.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Reminder Detail Dialog */}
      <Dialog open={!!selectedReminder} onOpenChange={(open) => {
        if (!open) {
          setSelectedReminder(null);
          // Ensure we stay on the remind page
          window.history.replaceState(null, '', '/remind');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              {selectedReminder?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReminder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStateColor(selectedReminder.reminderState)}>
                  {selectedReminder.reminderState}
                </Badge>
                {selectedReminder.priority && (
                  <Badge variant="outline" className="text-xs">
                    {selectedReminder.priority}
                  </Badge>
                )}
              </div>

              {selectedReminder.dueDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  {formatDueTime(selectedReminder.dueDate)}
                </div>
              )}

              {selectedReminder.reminderState === 'active' && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      completeReminderMutation.mutate(selectedReminder.id);
                      setSelectedReminder(null);
                    }}
                    disabled={completeReminderMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      dismissReminderMutation.mutate(selectedReminder.id);
                      setSelectedReminder(null);
                    }}
                    disabled={dismissReminderMutation.isPending}
                    className="flex-1"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          )}

          <Button 
            variant="ghost" 
            className="mt-4"
            onClick={() => setSelectedReminder(null)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}