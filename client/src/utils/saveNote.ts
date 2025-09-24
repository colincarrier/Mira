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
    body   : JSON.stringify({ 
      content: content,
      doc_json: docJson
    })
  });

  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  
  // Validate content-type header to prevent HTML caching
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error('Server did not return JSON; refusing to cache response.');
  }
  
  // Parse and normalize the response
  const rawNote = await res.json();
  return normalizeNote(rawNote);
}