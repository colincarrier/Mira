// ---------- client/src/utils/parseMiraResponse.ts ----------
import type { MiraResponse } from '../../../shared/mira-response';

export function parseMira(raw: any): MiraResponse | null {
  if (!raw) return null;
  
  try {
    let parsed = raw;
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw);
    }
    
    // Check if this is a V3 MiraResponse
    if (parsed.meta?.v === 3) {
      return parsed as MiraResponse;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse MiraResponse:', error);
    return null;
  }
}

// Helper to check if we should use MiraResponse vs legacy parsing
export function shouldUseMiraResponse(note: any): boolean {
  if (!note) return false;
  
  // Check if mira_response field exists and has V3 data
  if (note.miraResponse || note.mira_response) {
    const mira = parseMira(note.miraResponse || note.mira_response);
    return mira?.meta?.v === 3;
  }
  
  return false;
}

// Unified parser that handles both V3 and legacy formats
export function parseNoteContent(note: any): { 
  title: string; 
  content: string; 
  mira?: MiraResponse | null;
  legacy?: any;
} {
  if (!note) {
    return { title: '', content: '' };
  }
  
  // Try V3 first
  const mira = parseMira(note.miraResponse || note.mira_response);
  if (mira) {
    return {
      title: mira.content.split('\n')[0]?.replace(/^#+\s*/, '') || note.content.split('\n')[0] || 'Untitled',
      content: mira.content,
      mira
    };
  }
  
  // Fall back to legacy rich context
  let legacy = null;
  if (note.richContext) {
    try {
      legacy = typeof note.richContext === 'string' 
        ? JSON.parse(note.richContext) 
        : note.richContext;
    } catch (error) {
      console.warn('Failed to parse legacy richContext:', error);
    }
  }
  
  return {
    title: note.aiGeneratedTitle || note.content.split('\n')[0] || 'Untitled',
    content: note.content,
    legacy
  };
}

// Legacy export name for compatibility
export const parseMiraResponse = parseMira;