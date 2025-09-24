import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/utils';

interface RealTimeEvent {
  type: 'note_created' | 'note_updated' | 'connected';
  noteId?: number;
  noteData?: any;
  updates?: any;
  clientId?: string;
  timestamp?: string;
}

/**
 * Reconnect-aware SSE subscription.
 * Skips invalidation if the current textarea has focus (prevents overwrite).
 */
export function useRealTimeUpdates() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    const connect = () => {
      const eventSource = new EventSource('/api/realtime-updates');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[RealTime] Connected to real-time updates');
        retriesRef.current = 0; // Reset retries on successful connection
      };

      eventSource.onmessage = (event) => {
        try {
          const data: RealTimeEvent = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('[RealTime] Client connected:', data.clientId);
              break;
              
            case 'note_created': {
              console.log('[RealTime] Note created:', data.noteId);
              const note = data.noteData;
              if (!note) break;
              
              // Debounced update to prevent rapid flickers
              const updateTimer = setTimeout(() => {
                queryClient.setQueryData(queryKeys.notes.all, (old: any[] | undefined) => {
                  if (!old) return [note];
                  
                  // Check for duplicates by multiple identifiers
                  const existingIndex = old.findIndex((n: any) => {
                    // Match by ID
                    if (n.id === note.id) return true;
                    // Match by tempId if present
                    if (n.tempId && note.tempId && n.tempId === note.tempId) return true;
                    // Match by content + timestamp (within 5 seconds)
                    if (n.content === note.content) {
                      const timeDiff = Math.abs(
                        new Date(n.createdAt || n.created_at).getTime() - 
                        new Date(note.createdAt || note.created_at).getTime()
                      );
                      return timeDiff < 5000; // 5 second window
                    }
                    return false;
                  });
                  
                  if (existingIndex >= 0) {
                    // Replace the optimistic/temp note with real one
                    const updated = [...old];
                    updated[existingIndex] = note;
                    return updated;
                  } else {
                    // Add as new note only if truly new
                    return [note, ...old];
                  }
                });
              }, 100); // 100ms debounce
              
              // Store timer for cleanup
              (window as any).__noteCreateTimer = updateTimer;
              break;
            }
              
            case 'note_updated':
              console.log('[RealTime] Note updated:', data.noteId);
              
              // Clear any pending create timer to prevent race
              if ((window as any).__noteCreateTimer) {
                clearTimeout((window as any).__noteCreateTimer);
              }
              
              // Prevent clobber while editing - check if the specific note's textarea has focus
              const textarea = document.querySelector(
                `textarea[data-note-id="${data.noteId}"]`
              ) as HTMLTextAreaElement | null;
              if (textarea && document.activeElement === textarea) {
                console.log('[RealTime] Skipping update - note is being edited');
                return;
              }
              
              // Use setQueryData for both detail and list
              if (data.noteId && data.noteData) {
                queryClient.setQueryData(queryKeys.notes.detail(data.noteId), data.noteData);
                
                // Update in the list as well
                queryClient.setQueryData(queryKeys.notes.all, (old: any[] | undefined) => {
                  if (!old) return old;
                  return old.map(n => n.id === data.noteId ? { ...n, ...data.noteData } : n);
                });
              }
              break;
              
            default:
              console.log('[RealTime] Unknown event type:', data.type);
          }
        } catch (error) {
          console.error('[RealTime] Failed to parse event data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[RealTime] EventSource error:', error);
        eventSourceRef.current?.close();
        eventSourceRef.current = null;
        
        // Exponential backoff: 1-2-4-8-16-30 seconds
        retriesRef.current += 1;
        const delay = Math.min(2 ** retriesRef.current, 30) * 1000;
        console.log(`[RealTime] Reconnecting in ${delay/1000}s...`);
        
        setTimeout(connect, delay);
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [queryClient]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
  };
}