import { useEffect, useRef } from 'react';
import { queueOp, dequeueOps, removeOp } from '../offline/queueAdapter';
import { QueueOp } from '@shared/types';
import { useToast } from '@/hooks/use-toast';

const MAX_RETRIES = 3;
const BACKOFF = [0, 2000, 4000, 8000]; // ms

export function useFlushQueue() {
  const retryRef = useRef(new Map<string, number>());
  const { toast } = useToast();

  useEffect(() => {
    let stop = false;
    const loop = async () => {
      while (!stop) {
        const ops = await dequeueOps();
        for (const op of ops) {
          if (!op) continue;

          const tries = retryRef.current.get(op.id) ?? 0;
          if (tries >= MAX_RETRIES) {
            console.error(`[Queue] dropping ${op.id}`);
            await removeOp(op.id);
            toast({
              title: 'Sync Failed',
              description: 'Some changes could not sync and were discarded',
              variant: 'destructive'
            });
            continue;
          }

          try {
            if (op.type === 'edit') {
              await pushEdit(op);
            } else {
              await pushInstruct(op);
            }
            await removeOp(op.id);
            retryRef.current.delete(op.id);
          } catch (e) {
            retryRef.current.set(op.id, tries + 1);
            await delay(BACKOFF[tries + 1] ?? 30000);
          }
        }
        await delay(3000);
      }
    };
    loop();
    return () => {
      stop = true;
    };
  }, [toast]);
}

async function pushEdit(op: QueueOp & { type: 'edit' }) {
  const response = await fetch(`/api/notes/${op.noteId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(op),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync edit: ${response.statusText}`);
  }
}

async function pushInstruct(op: QueueOp & { type: 'instruct' }) {
  const response = await fetch(`/api/notes/${op.noteId}/instruct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: op.prompt }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to sync instruct: ${response.statusText}`);
  }
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}