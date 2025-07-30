// Part 1: Offline queue for notes and todos using IndexedDB
import { openDB } from 'idb';

export interface QueueItem {
  id: string;
  kind: 'note' | 'todo';
  payload: any;
  timestamp: number;
  retryCount: number;
}

const db = openDB('mira-offline', 1, {
  upgrade(database) {
    database.createObjectStore('queue', { keyPath: 'id' });
  },
});

export async function queueOffline(item: Omit<QueueItem, 'timestamp' | 'retryCount'>): Promise<void> {
  const queueItem: QueueItem = {
    ...item,
    timestamp: Date.now(),
    retryCount: 0,
  };
  
  const tx = (await db).transaction('queue', 'readwrite');
  await tx.objectStore('queue').put(queueItem);
  await tx.done;
}

export async function flushQueue(syncFn: (item: QueueItem) => Promise<void>): Promise<void> {
  const database = await db;
  const tx = database.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const allItems = await store.getAll();
  
  for (const item of allItems) {
    try {
      await syncFn(item);
      await store.delete(item.id);
    } catch (error) {
      console.warn('Failed to sync item, keeping in queue:', item.id, error);
      // Update retry count
      item.retryCount = (item.retryCount || 0) + 1;
      if (item.retryCount < 3) {
        await store.put(item);
      } else {
        console.error('Max retries reached, removing item:', item.id);
        await store.delete(item.id);
      }
    }
  }
  
  await tx.done;
}

export async function getQueuedItems(): Promise<QueueItem[]> {
  const database = await db;
  return database.getAll('queue');
}

export async function clearQueue(): Promise<void> {
  const database = await db;
  const tx = database.transaction('queue', 'readwrite');
  await tx.objectStore('queue').clear();
  await tx.done;
}