import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Calendar, CheckCircle, Archive, AlertCircle, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReminderInput } from "@/components/reminder-input";
import BottomNavigation from "@/components/bottom-navigation";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
      return apiRequest(`/api/reminders/${id}/complete`, {
        method: 'PUT'
      });
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
      return apiRequest(`/api/reminders/${id}/dismiss`, {
        method: 'PUT'
      });
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
      return apiRequest(`/api/reminders/${id}/archive`, {
        method: 'PUT'
      });
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
    <div className="min-h-screen bg-gray-50">
      {/* Status Bar */}
      <div className="safe-area-top bg-[hsl(var(--background))]"></div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-serif font-medium text-gray-900">
              Reminders
            </h1>
            <Button
              onClick={() => setShowCreateReminder(true)}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">{activeCount} active</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm text-red-600">{overdueCount} overdue</span>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'active', label: 'Active', icon: Clock },
              { key: 'overdue', label: 'Overdue', icon: AlertCircle },
              { key: 'completed', label: 'Done', icon: CheckCircle },
              { key: 'all', label: 'All', icon: Filter }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Reminder Section */}
      {showCreateReminder && (
        <div className="bg-white border-b border-gray-200 p-4">
          <ReminderInput
            onReminderCreated={(reminder) => {
              setShowCreateReminder(false);
              queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateReminder(false)}
            className="mt-2"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Reminders List */}
      <div className="pb-24 px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'active' ? 'No active reminders' : 
               filter === 'overdue' ? 'No overdue reminders' :
               filter === 'completed' ? 'No completed reminders' : 'No reminders'}
            </h3>
            <p className="text-gray-500 mb-4">
              {filter === 'active' ? 'Create your first reminder to get started' : 
               `No ${filter} reminders to show`}
            </p>
            {filter === 'active' && (
              <Button
                onClick={() => setShowCreateReminder(true)}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Reminder
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((reminder) => (
              <Card 
                key={reminder.id} 
                className="bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setSelectedReminder(reminder)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate mb-1">
                        {reminder.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStateColor(reminder.reminderState)}>
                          {reminder.reminderState}
                        </Badge>
                        {reminder.priority && (
                          <Badge variant="outline" className="text-xs">
                            {reminder.priority}
                          </Badge>
                        )}
                      </div>

                      {reminder.dueDate && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="h-3 w-3" />
                          {formatDueTime(reminder.dueDate)}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 ml-3">
                      {reminder.reminderState === 'active' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              completeReminderMutation.mutate(reminder.id);
                            }}
                            disabled={completeReminderMutation.isPending}
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
                            disabled={dismissReminderMutation.isPending}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
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