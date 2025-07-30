import type { NoteEvent } from '../../../../shared/types';

const channels = new Map<number, Set<import('express').Response>>();

export function registerClient(noteId: number, res: any) {
  if (!channels.has(noteId)) channels.set(noteId, new Set());
  channels.get(noteId)!.add(res);
  res.on('close', () => channels.get(noteId)!.delete(res));
}

export function broadcastToNote(noteId: number, event: NoteEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  (channels.get(noteId) || []).forEach(res => res.write(payload));
}