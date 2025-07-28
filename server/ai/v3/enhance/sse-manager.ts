import { EventEmitter } from 'events';
import type { Response } from 'express';
import type { EnhancementProgress } from '../types/enhancement-context.js';

export const enhancementEmitter = new EventEmitter();

class SSEManager {
  private map = new Map<string, Set<Response>>();
  private heart = new Map<string, NodeJS.Timeout>();

  add(noteId: string, res: Response) {
    if (!this.map.has(noteId)) this.map.set(noteId, new Set());
    const set = this.map.get(noteId)!;
    set.add(res);

    if (set.size === 1) {
      const hb = setInterval(() => this.push(noteId, { type: 'heartbeat' }), 20000);
      this.heart.set(noteId, hb);
    }

    res.on('close', () => {
      set.delete(res);
      if (set.size === 0) {
        clearInterval(this.heart.get(noteId)!);
        this.heart.delete(noteId);
        this.map.delete(noteId);
      }
    });
  }

  push(noteId: string, payload: EnhancementProgress | { type: 'heartbeat' }) {
    this.map.get(noteId)?.forEach((r) => {
      try { r.write(`data: ${JSON.stringify(payload)}\n\n`); }
      catch { /* ignore broken pipe – 'close' handler will prune */ }
    });
  }
}

export const sseManager = new SSEManager();

// fan‑out any progress event
enhancementEmitter.on('broadcast', ({ noteId, payload }) =>
  sseManager.push(noteId, payload)
);