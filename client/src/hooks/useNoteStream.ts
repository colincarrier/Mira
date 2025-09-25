import { useEffect } from 'react';

export function useNoteStream(noteId: string, onPatch: (steps: any[]) => void) {
  useEffect(() => {
    // Skip if no noteId provided
    if (!noteId) return;

    // ✅ Use the correct per-note SSE endpoint (this exists on the server)
    const es = new EventSource(`/api/notes/${noteId}/events`);

    es.onopen = () => {
      console.log(`[SSE] Connected to note stream: ${noteId}`);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          console.log('[SSE] Stream connected:', data);
        } else if (data.type === 'patch' && data.steps) {
          // Pass raw step JSON (conversion happens where schema exists)
          onPatch(data.steps);
        } else if (data.type === 'note_updated' && data.note) {
          console.log('[SSE] Note updated:', data.note);
        }
      } catch (err) {
        console.error('[SSE] Error parsing message:', err);
      }
    };

    es.onerror = (err) => {
      console.error('[SSE] Connection error:', err);
      // EventSource auto-reconnects
    };

    return () => {
      console.log(`[SSE] Closing connection for note: ${noteId}`);
      es.close();
    };
  }, [noteId, onPatch]);
}