import { storage } from '../storage';

export async function persistSideEffects(parsed: any, noteId: number) {
  // Todos
  for (const t of parsed.todos || []) {
    await storage.createTodo({ 
      title: t.title, 
      priority: t.priority, 
      noteId 
    });
  }
  
  // Reminder
  if (parsed.reminder?.timeISO) {
    await storage.createTodo({
      title: parsed.title,
      noteId,
      priority: 'high',
      isActiveReminder: true,
      timeDue: new Date(parsed.reminder.timeISO)
    });
  }
  
  // Bullet‑to‑collection (sample)
  if (parsed.aiBody && parsed.aiBody.startsWith('•')) {
    const bullets = parsed.aiBody.split('\n').map((b: string) => b.replace(/^•\s*/, ''));
    
    // Find or create Bullets collection
    const collections = await storage.getCollections();
    let bulletsCollection = collections.find(c => c.name === 'Bullets');
    
    if (!bulletsCollection) {
      bulletsCollection = await storage.createCollection({
        name: 'Bullets',
        icon: 'list',
        color: '#6366f1'
      });
    }
    
    for (const text of bullets) {
      if (text.trim()) {
        await storage.createItem({ 
          title: text, 
          type: 'bullet', 
          collectionId: bulletsCollection.id, 
          sourceNoteId: noteId 
        });
      }
    }
  }
}