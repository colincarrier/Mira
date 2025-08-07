export interface SavePayload {
  id: number;
  source: 'editor' | 'textarea' | 'ai';
  content?: string;
  docJson?: any;
}

import { normalizeNote } from './normalizeNote';

export async function saveNote({ id, content, docJson }: SavePayload) {
  const res = await fetch(`/api/notes/${id}`, {
    method : 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ content, doc_json: docJson })
  });

  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  const ct = res.headers.get('content-type');
  if (!ct?.includes('json')) throw new Error('Server sent non-JSON');
  
  // Normalize the response from snake_case to camelCase
  const rawNote = await res.json();
  return normalizeNote(rawNote);
}