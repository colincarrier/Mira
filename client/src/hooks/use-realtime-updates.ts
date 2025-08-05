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
              
            case 'note_created':
              console.log('[RealTime] Note created:', data.noteId);
              // Immediately invalidate notes query to show new note
              queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
              break;
              
            case 'note_updated':
              console.log('[RealTime] Note updated:', data.noteId);
              
              // Prevent clobber while editing - check if the specific note's textarea has focus
              const textarea = document.querySelector(
                `textarea[data-note-id="${data.noteId}"]`
              ) as HTMLTextAreaElement | null;
              if (textarea && document.activeElement === textarea) {
                console.log('[RealTime] Skipping update - note is being edited');
                return;
              }
              
              // Invalidate both the notes list and the specific note
              queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
              if (data.noteId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(data.noteId) });
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