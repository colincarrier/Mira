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
    // Don't trigger onReminderUpdated when just closing the dialog
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
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
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