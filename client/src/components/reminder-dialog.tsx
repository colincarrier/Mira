import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReminderInput } from './reminder-input';
import type { Todo } from '@shared/schema';

interface ReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingReminder?: Todo | null;
  onReminderUpdated?: () => void;
}

export function ReminderDialog({ 
  open, 
  onOpenChange, 
  existingReminder,
  onReminderUpdated
}: ReminderDialogProps) {
  
  const handleClose = () => {
    // Preserve navigation state when closing dialog
    window.history.replaceState(null, '', '/remind');
    onOpenChange(false);
  };

  const handleReminderCreated = () => {
    onReminderUpdated?.();
    handleClose();
  };

  const handleReminderUpdate = () => {
    onReminderUpdated?.();
    handleClose();
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
          initialValue={existingReminder?.title || ''}
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