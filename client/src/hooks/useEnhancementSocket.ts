import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';

export function useEnhancementSocket(noteId?: number) {
  const qc = useQueryClient();
  
  useEffect(() => {
    if (!noteId) return;
    
    // Connect to the correct SSE endpoint for this specific note
    const es = new EventSource(`/api/notes/${noteId}/events`);
    
    es.onopen = () => {
      console.log('[SSE] Connected to note', noteId);
    };
    
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        
        // Handle enhancement complete events
        if (msg.type === 'enhancement_complete') {
          console.log('[SSE] Enhancement complete for note', noteId);
          
          // Invalidate queries to refresh the UI
          qc.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
          qc.invalidateQueries({ queryKey: queryKeys.notes.all });
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    };
    
    es.onerror = (error) => {
      console.error('[SSE] Connection error, closing:', error);
      es.close();
    };
    
    return () => {
      console.log('[SSE] Closing connection for note', noteId);
      es.close();
    };
  }, [noteId, qc]);
}