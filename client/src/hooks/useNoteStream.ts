import { useEffect } from 'react';
import type { Step } from 'prosemirror-transform';

export function useNoteStream(noteId: string, onPatch: (steps: Step[]) => void) {
  useEffect(() => {
    // Using existing realtime infrastructure
    const es = new EventSource(`/api/realtime?noteId=${noteId}`);
    
    const handler = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'patch' && data.steps) {
          // Convert steps from JSON to Step objects
          const steps = data.steps.map((stepJson: any) => Step.fromJSON(stepJson));
          onPatch(steps);
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