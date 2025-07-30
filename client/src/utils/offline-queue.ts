import { openDB } from 'idb';

const DB_NAME = 'mira-offline';
const STORE = 'pending';

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(db) { 
      db.createObjectStore(STORE, { keyPath: 'id' }); 
    }
  });
}

export async function queueOffline(item: any) {
  (await db()).put(STORE, item);
}

window.addEventListener('online', async () => {
  const d = await db();
  const all = await d.getAll(STORE);
  for (const note of all) {
    // Reuse createNote mutation
    await fetch('/api/notes', { 
      method: 'POST', 
      body: JSON.stringify(note),
      headers: { 'Content-Type': 'application/json' }
    });
    await d.delete(STORE, note.id);
  }
});