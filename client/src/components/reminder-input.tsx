import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Calendar, Mic, MoreHorizontal, Trash2, Archive } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ReminderInputProps {
  onReminderCreated?: (reminder: any) => void;
  initialValue?: string;
  existingReminder?: any;
  onUpdate?: (reminder: any) => void;
  onDelete?: (reminderId: number) => void;
  onArchive?: (reminderId: number) => void;
}

export function ReminderInput({ 
  onReminderCreated, 
  initialValue = "", 
  existingReminder,
  onUpdate,
  onDelete,
  onArchive
}: ReminderInputProps) {
  const [input, setInput] = useState(initialValue);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const parseReminderInput = async (text: string) => {
    if (!text.trim()) {
      setParsedInfo(null);
      return;
    }

    try {
      const response = await fetch('/api/reminders/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });

      if (response.ok) {
        const parsed = await response.json();
        setParsedInfo(parsed);
      }
    } catch (error) {
      console.error('Failed to parse reminder:', error);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    // Debounce parsing
    setTimeout(() => parseReminderInput(value), 500);
  };

  const createReminder = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: input,
          parsedInfo: parsedInfo
        })
      });

      if (response.ok) {
        const reminder = await response.json();
        onReminderCreated?.(reminder);
        setInput("");
        setParsedInfo(null);
        toast({
          title: "Reminder created",
          description: parsedInfo?.timeString ? `Scheduled for ${parsedInfo.timeString}` : undefined
        });
      } else {
        throw new Error('Failed to create reminder');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarLink = () => {
    if (!existingReminder || !parsedInfo?.dueTime) return;

    const startTime = new Date(parsedInfo.dueTime);
    const endTime = new Date(startTime.getTime() + (30 * 60 * 1000)); // 30 min default

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(existingReminder.title)}&dates=${startTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent('Reminder from Mira')}`;
    
    window.open(calendarUrl, '_blank');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      
      // Voice recording implementation would go here
      toast({
        title: "Voice recording",
        description: "Voice input feature coming soon"
      });
      
      setTimeout(() => {
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      }, 2000);
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access for voice input",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with menu */}
      {existingReminder && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={generateCalendarLink}>
                <Calendar className="h-4 w-4 mr-2" />
                Add to Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive?.(existingReminder.id)}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(existingReminder.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Input Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={existingReminder ? "Update reminder..." : "Type or speak your reminder..."}
            onKeyDown={(e) => e.key === 'Enter' && !existingReminder && createReminder()}
            className="pr-12"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={startRecording}
              className={`h-8 w-8 p-0 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-red-100 text-red-600' 
                  : 'hover:bg-blue-100 text-blue-600'
              }`}
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {!existingReminder && (
          <Button 
            onClick={createReminder} 
            disabled={loading || !input.trim()}
            size="sm"
          >
            {loading ? "Adding..." : "Add"}
          </Button>
        )}
      </div>

      {/* Existing Schedule Display for Reminders */}
      {existingReminder && existingReminder.plannedNotificationStructure && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="text-sm space-y-1">
            <div className="font-medium text-blue-900">Current Reminder Schedule</div>
            {existingReminder.timeDue && (
              <div className="text-blue-700">
                📅 Due: {new Date(existingReminder.timeDue).toLocaleString()}
              </div>
            )}
            {existingReminder.plannedNotificationStructure.leadTime && (
              <div className="text-blue-700">
                🔔 Notify {existingReminder.plannedNotificationStructure.leadTime} minutes before
              </div>
            )}
            {existingReminder.plannedNotificationStructure.recurrence && (
              <div className="text-blue-700">
                🔄 {existingReminder.plannedNotificationStructure.recurrence}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Parsed Information Display */}
      {parsedInfo && (
        <Card className="p-3 bg-muted/50">
          <div className="text-sm space-y-1">
            {parsedInfo.timeString && (
              <div className="text-muted-foreground">
                📅 {parsedInfo.timeString}
              </div>
            )}
            {parsedInfo.leadTime && (
              <div className="text-muted-foreground">
                🔔 Notify {parsedInfo.leadTime} before
              </div>
            )}
            {parsedInfo.recurrence && (
              <div className="text-muted-foreground">
                🔄 {parsedInfo.recurrence}
              </div>
            )}
          </div>
        </Card>
      )}

      
    </div>
  );
}