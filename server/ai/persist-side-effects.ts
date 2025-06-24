import { storage } from '../storage';
import { detectTimeReferences } from '../brain/miraAIProcessing';

export async function persistSideEffects(rc, noteId) {
  if (rc.aiBody?.startsWith('•')) {
    for (const line of rc.aiBody.split('\\n')) {
      const title = line.replace(/^•\\s*/, '').trim();
      if (title) {
        await storage.createTodo({ title, noteId });
      }
    }
  }

  const { shouldCreateReminder, extractedTimes } = detectTimeReferences(rc.original || "");
  if (shouldCreateReminder && extractedTimes[0]) {
    const dt = new Date(); // stub, replace with proper parser
    await storage.createReminder({
      title: rc.title,
      reminderTime: dt,
      noteId
    });
  }
}
