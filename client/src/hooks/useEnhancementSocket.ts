import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';
import type { NoteWithTodos } from '@shared/schema';

/**
 * Hook that listens for real-time AI enhancement completion events
 * and updates the React Query cache accordingly
 */
export function useEnhancementSocket(noteId?: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!noteId) return;

    let eventSource: EventSource | null = null;

    try {
      // Connect to SSE endpoint for real-time updates
      eventSource = new EventSource(`/api/notes/${noteId}/events`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'enhancement_complete') {
            // Update the specific note in cache with enhanced content
            queryClient.setQueryData(
              queryKeys.notes.detail(noteId),
              (old: NoteWithTodos | undefined) => {
                if (!old) return old;
                
                return {
                  ...old,
                  miraResponse: data.miraResponse,
                  richContext: data.richContext,
                  aiEnhanced: true,
                  doc_json: data.docJson || old.doc_json,
                  isProcessing: false,
                };
              }
            );
            
            // Also invalidate the notes list to show updated preview
            queryClient.invalidateQueries({ 
              queryKey: ["/api/notes"] 
            });
          }
        } catch (error) {
          console.warn('Failed to parse enhancement event:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.warn('Enhancement socket error:', error);
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (eventSource) {
            eventSource.close();
            // Trigger re-effect to reconnect
          }
        }, 5000);
      };

    } catch (error) {
      console.warn('Failed to establish enhancement socket:', error);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [noteId, queryClient]);
}