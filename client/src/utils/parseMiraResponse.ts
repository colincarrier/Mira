// ---------- client/src/utils/parseMiraResponse.ts ------------
// V3 MiraResponse parser - replaces legacy parseRichContext

import type { MiraResponse } from '../../../shared/mira-response';

/**
 * Parse note's mira_response column (V3 format) with graceful fallback for legacy notes
 */
export function parseMiraResponse(json: unknown): MiraResponse | null {
  try {
    // Handle null/undefined
    if (!json) return null;
    
    // Parse JSON string if needed
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    
    // Validate it's a V3 MiraResponse
    if (data && typeof data === 'object' && data.meta?.v === 3) {
      return {
        content: data.content || '',
        tasks: Array.isArray(data.tasks) ? data.tasks.slice(0, 3) : [], // Max 3 tasks
        links: Array.isArray(data.links) ? data.links : [],
        reminders: Array.isArray(data.reminders) ? data.reminders : [],
        entities: Array.isArray(data.entities) ? data.entities : [],
        media: Array.isArray(data.media) ? data.media : [],
        meta: {
          model: data.meta?.model || 'unknown',
          confidence: data.meta?.confidence || 0.5,
          processingTimeMs: data.meta?.processingTimeMs || 0,
          intent: data.meta?.intent || 'general',
          v: 3
        },
        thread: Array.isArray(data.thread) ? data.thread : []
      };
    }
    
    return null; // Not V3 format
    
  } catch (error) {
    console.warn('Failed to parse MiraResponse:', error);
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