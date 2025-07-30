// Part 1: Offline synchronization hook
import { useEffect } from 'react';
import { flushQueue, getQueuedItems } from '../db/offlineQueue';

export function useOfflineSync() {
  useEffect(() => {
    const syncQueue = async () => {
      try {
        await flushQueue(async (item) => {
          if (item.kind === 'note') {
            const { id, content, action } = item.payload;
            
            const response = await fetch(
              action === 'create' ? '/api/notes' : `/api/notes/${id}`,
              {
                method: action === 'create' ? 'POST' : 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
              }
            );
            
            if (!response.ok) {
              throw new Error(`Sync failed: ${response.statusText}`);
            }
          }
        });
        
        // Refresh queries after sync
        console.log('✅ Offline queue synced successfully');
      } catch (error) {
        console.warn('Queue sync failed:', error);
      }
    };

    // Sync on app startup
    syncQueue();

    // Sync when coming back online
    const handleOnline = () => {
      console.log('Back online, syncing queue...');
      syncQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Return queue status
  const checkQueueStatus = async () => {
    const items = await getQueuedItems();
    return {
      hasQueuedItems: items.length > 0,
      queuedCount: items.length,
    };
  };

  return { checkQueueStatus };
}