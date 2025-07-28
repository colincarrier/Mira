import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface RealTimeEvent {
  type: 'note_created' | 'note_updated' | 'connected';
  noteId?: number;
  noteData?: any;
  updates?: any;
  clientId?: string;
  timestamp?: string;
}

export function useRealTimeUpdates() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Create EventSource connection
    const eventSource = new EventSource('/api/realtime-updates');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[RealTime] Connected to real-time updates');
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
            queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
            break;
            
          case 'note_updated':
            console.log('[RealTime] Note updated:', data.noteId);
            // Invalidate both the notes list and the specific note
            queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
            if (data.noteId) {
              queryClient.invalidateQueries({ queryKey: [`/api/notes/${data.noteId}`] });
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
      // Will automatically try to reconnect
    };

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