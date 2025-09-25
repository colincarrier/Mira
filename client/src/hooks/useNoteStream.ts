import { useEffect } from 'react';

export function useNoteStream(noteId: string, onPatch: (steps: any[]) => void) {
  useEffect(() => {
    // Skip if no noteId provided
    if (!noteId) return;
    
    // Using existing realtime infrastructure
    const es = new EventSource(`/api/realtime?noteId=${noteId}`);
    
    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'patch' && data.steps) {
          // Pass raw step JSON data, let the consumer handle conversion
          onPatch(data.steps);
        }
      } catch (err) {
        console.error('[SSE] Error parsing patch:', err);
      }
    };
    
    es.addEventListener('message', handler);
    es.addEventListener('patch', handler);
    
    es.onerror = (err) => {
      console.error('[SSE] Connection error:', err);
    };
    
    return () => {
      es.close();
    };
  }, [noteId, onPatch]);
}