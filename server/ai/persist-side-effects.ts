import { storage } from '../storage';
import { detectTimeReferences } from '../brain/miraAIProcessing';

export async function persistSideEffects(rc: any, noteId: number) {
  /* create todos */
  for (const t of rc.todos ?? []) {
    await storage.createTodo({ title: t.title, noteId, priority: t.priority });
  }

  /* create reminder (explicit or inferred) */
  if (rc.reminder?.timeISO) {
    await storage.createReminder({
      title: rc.title,
      noteId,
      reminderTime: new Date(rc.reminder.timeISO)
    });
    return;
  }

  const { shouldCreateReminder, extractedTimes } =
    detectTimeReferences(rc.original ?? '');

  if (shouldCreateReminder && extractedTimes[0]) {
    await storage.createReminder({
      title: rc.title,
      noteId,
      reminderTime: new Date()        // TODO: smarter parse later
    });
  }
}
