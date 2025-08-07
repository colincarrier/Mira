import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';

export function useEnhancementSocket(noteId?: number) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!noteId) return;
    const es = new EventSource(`/api/realtime?noteId=${noteId}`);
    es.onopen = () => console.log('[SSE] connected', noteId);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'enhancement_complete' && msg.noteId === noteId) {
          qc.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
          qc.invalidateQueries({ queryKey: queryKeys.notes.list });
        }
      } catch (err) {
        console.error('[SSE] parse error', err);
      }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [noteId, qc]);
}