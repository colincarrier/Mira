import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReminderInput } from './reminder-input';
import type { Todo } from '@shared/schema';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingReminder?: Todo | null;
  onReminderUpdated?: () => void;
  prePopulatedText?: string;
}

export function ReminderDialog({ 
  open, 
  onOpenChange, 
  existingReminder,
  onReminderUpdated,
  prePopulatedText
}: ReminderDialogProps) {
  
  const handleClose = () => {
    // Preserve navigation state when closing dialog
    window.history.replaceState(null, '', '/remind');
    onReminderUpdated?.(); // Auto-save on close
    onOpenChange(false);
  };

  const handleReminderCreated = () => {
    onReminderUpdated?.();
    onOpenChange(false);
  };

  const handleReminderUpdate = () => {
    onReminderUpdated?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingReminder ? 'Update Reminder' : 'Create Reminder'}
          </DialogTitle>
        </DialogHeader>

        <ReminderInput
          initialValue={existingReminder?.title || prePopulatedText || ''}
          existingReminder={existingReminder}
          onReminderCreated={handleReminderCreated}
          onUpdate={handleReminderUpdate}
          onDelete={handleReminderUpdate}
          onArchive={handleReminderUpdate}
        />
      </DialogContent>
    </Dialog>
  );
}