import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock, Bell, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    title?: string;
    description?: string;
    dueDate?: Date;
    reminderType?: string;
    priority?: string;
  };
  mode: 'create' | 'edit';
  onSave: (reminderData: any) => void;
  onDelete?: () => void;
}

const REMINDER_TYPES = [
  { value: 'pickup', label: 'Pickup', defaultLeadTime: '10 minutes', icon: '📦' },
  { value: 'appointment', label: 'Appointment', defaultLeadTime: '30 minutes', icon: '🏥' },
  { value: 'call', label: 'Call', defaultLeadTime: '5 minutes', icon: '📞' },
  { value: 'meeting', label: 'Meeting', defaultLeadTime: '15 minutes', icon: '👥' },
  { value: 'medication', label: 'Medication', defaultLeadTime: 'immediate', icon: '💊' },
  { value: 'task', label: 'Task', defaultLeadTime: '15 minutes', icon: '✅' },
  { value: 'general', label: 'General', defaultLeadTime: '10 minutes', icon: '🔔' }
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'critical', label: 'Critical', color: 'text-red-600' }
];

export function ReminderDialog({ 
  open, 
  onOpenChange, 
  initialData, 
  mode, 
  onSave, 
  onDelete 
}: ReminderDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(initialData?.dueDate);
  const [dueTime, setDueTime] = useState('');
  const [reminderType, setReminderType] = useState(initialData?.reminderType || 'general');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [customLeadTime, setCustomLeadTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState('');

  // Auto-fill lead time based on reminder type
  useEffect(() => {
    const selectedType = REMINDER_TYPES.find(type => type.value === reminderType);
    if (selectedType && !customLeadTime) {
      setCustomLeadTime(selectedType.defaultLeadTime);
    }
  }, [reminderType, customLeadTime]);

  const handleSave = () => {
    const reminderData = {
      title: title.trim(),
      description: description.trim(),
      dueDate,
      dueTime,
      reminderType,
      priority,
      enableNotifications,
      leadTime: customLeadTime,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : null,
      isActiveReminder: true,
      plannedNotificationStructure: {
        type: reminderType,
        leadTime: customLeadTime,
        priority,
        notifications: enableNotifications ? [
          {
            type: 'before',
            offset: customLeadTime
          },
          {
            type: 'immediate',
            offset: '0 minutes'
          }
        ] : []
      }
    };

    onSave(reminderData);
    onOpenChange(false);
  };

  const handleClose = () => {
    // Preserve navigation state when closing dialog
    window.history.replaceState(null, '', '/remind');
    onOpenChange(false);
  };

  const selectedType = REMINDER_TYPES.find(type => type.value === reminderType);
  const selectedPriority = PRIORITY_LEVELS.find(p => p.value === priority);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedType?.icon} {mode === 'create' ? 'Create Reminder' : 'Edit Reminder'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What do you need to be reminded about?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Reminder Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={reminderType} onValueChange={setReminderType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        {type.icon} {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <span className={cn("capitalize", level.color)}>
                        {level.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label htmlFor="notifications">Enable Notifications</Label>
              </div>
              <Switch
                id="notifications"
                checked={enableNotifications}
                onCheckedChange={setEnableNotifications}
              />
            </div>

            {enableNotifications && (
              <div className="space-y-2">
                <Label htmlFor="leadTime">Notify me</Label>
                <Select value={customLeadTime} onValueChange={setCustomLeadTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">At the time</SelectItem>
                    <SelectItem value="5 minutes">5 minutes before</SelectItem>
                    <SelectItem value="10 minutes">10 minutes before</SelectItem>
                    <SelectItem value="15 minutes">15 minutes before</SelectItem>
                    <SelectItem value="30 minutes">30 minutes before</SelectItem>
                    <SelectItem value="1 hour">1 hour before</SelectItem>
                    <SelectItem value="2 hours">2 hours before</SelectItem>
                    <SelectItem value="1 day">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Recurring Options */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label htmlFor="recurring">Recurring Reminder</Label>
              </div>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="pattern">Repeat</Label>
                <Select value={recurringPattern} onValueChange={setRecurringPattern}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekdays">Weekdays only</SelectItem>
                    <SelectItem value="weekends">Weekends only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div>
            {mode === 'edit' && onDelete && (
              <Button variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              {mode === 'create' ? 'Create Reminder' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}