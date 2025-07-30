// ---------- client/src/utils/parseMiraResponse.ts ------------
// V3 MiraResponse parser - replaces legacy parseRichContext

import type { MiraResponse } from '../../../shared/types';

/**
 * Parse note's mira_response column (V3 format) with graceful fallback for legacy notes
 */
export function parseMiraResponse(raw: unknown): MiraResponse | null {
  try {
    if (!raw) return null;
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const looksV3 = data?.meta?.v === 3
      || (data.content && data.meta && data.meta.intent);

    if (!looksV3) return null;

    return {
      content: data.content ?? '',
      tasks: data.tasks ?? [],
      links: data.links ?? [],
      reminders: data.reminders ?? [],
      entities: data.entities ?? [],
      media: data.media ?? [],
      enrichedLinks: data.enrichedLinks ?? [],
      meta: { ...data.meta, v: 3 },
      thread: data.thread ?? []
    };
  } catch (e) {
    console.warn('[parseMiraResponse] failed:', e);
    return null;
  }
}

/**
 * Check if a note has V3 MiraResponse data
 */
export function hasV3Response(note: any): boolean {
  try {
    const parsed = parseMiraResponse(note.miraResponse || note.mira_response);
    return parsed !== null;
  } catch {
    return false;
  }
}

/**
 * Extract display content from either V3 or legacy format
 */
export function getDisplayContent(note: any): {
  content: string;
  tasks: any[];
  hasV3: boolean;
} {
  // Try V3 first
  const v3Response = parseMiraResponse(note.miraResponse || note.mira_response);
  if (v3Response) {
    return {
      content: v3Response.content,
      tasks: v3Response.tasks || [],
      hasV3: true
    };
  }
  
  // Fallback to legacy richContext
  try {
    const legacy = note.richContext ? JSON.parse(note.richContext) : null;
    if (legacy) {
      return {
        content: legacy.enhancedContent || legacy.context || '',
        tasks: legacy.todos || [],
        hasV3: false
      };
    }
  } catch (error) {
    console.warn('Failed to parse legacy richContext:', error);
  }
  
  // Final fallback to original content
  return {
    content: note.content || '',
    tasks: [],
    hasV3: false
  };
}