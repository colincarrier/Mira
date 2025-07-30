import { useEffect } from 'react';

export function useNoteEvents(noteId: number, onEvent: (e: any) => void) {
  useEffect(() => {
    const es = new EventSource(`/api/notes/${noteId}/events`);
    es.onmessage = (ev) => onEvent(JSON.parse(ev.data));
    return () => es.close();
  }, [noteId]);
}