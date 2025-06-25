import { storage } from '../storage.js';

export async function persistSideEffects(analysis: any, noteId: number) {
  try {
    // Create todos from AI analysis
    if (analysis.todos && Array.isArray(analysis.todos)) {
      console.log(`[PERSIST] Creating ${analysis.todos.length} todos for note ${noteId}`);
      for (const todo of analysis.todos) {
        try {
          await storage.createTodo({
            title: todo.title,
            noteId: noteId,
            completed: false,
            priority: todo.priority || 'medium'
          });
          console.log(`[PERSIST] Created todo: ${todo.title}`);
        } catch (todoError) {
          console.error('[PERSIST] Todo creation failed:', todoError);
        }
      }
    }

    // Handle time-based reminders (basic implementation)
    if (analysis.reminder && analysis.reminder.timeISO) {
      try {
        await storage.createTodo({
          title: `Reminder: ${analysis.title}`,
          noteId: noteId,
          completed: false,
          priority: 'high',
          timeDue: new Date(analysis.reminder.timeISO)
        });
        console.log(`[PERSIST] Created reminder for ${analysis.reminder.timeISO}`);
      } catch (reminderError) {
        console.error('[PERSIST] Reminder creation failed:', reminderError);
      }
    }

    console.log(`[PERSIST] Side effects processing completed for note ${noteId}`);
  } catch (error) {
    console.error(`[PERSIST] Side effects processing failed for note ${noteId}:`, error);
  }
}
