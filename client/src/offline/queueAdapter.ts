import { indexedDBManager } from '../lib/indexeddb';
import { QueueOp } from '@shared/types';

export async function queueOp(op: QueueOp) {
  await indexedDBManager.addToSyncQueue('update', 'notes', op);
}

export async function dequeueOps(): Promise<QueueOp[]> {
  const syncQueue = await indexedDBManager.getSyncQueue();
  return syncQueue
    .filter(item => item.table === 'notes' && item.data?.type)
    .map(item => item.data as QueueOp);
}

export async function removeOp(id: string) {
  // Since IndexedDBManager doesn't have removeFromSyncQueue by ID,
  // we'll process all items and filter out the one to remove
  const syncQueue = await indexedDBManager.getSyncQueue();
  for (const item of syncQueue) {
    if (item.data?.id === id) {
      await indexedDBManager.processSyncItem(item);
    }
  }
}