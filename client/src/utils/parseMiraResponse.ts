// ---------- client/src/utils/parseMiraResponse.ts ----------
import type { MiraResponse } from '../../../shared/mira-response';

export function parseMira(raw: any): any | null {
  if (!raw) {
    console.log('🔍 parseMira: No raw data provided');
    return null;
  }
  
  try {
    let parsed = raw;
    if (typeof raw === 'string') {
      parsed = JSON.parse(raw);
    }
    
    console.log('🔍 parseMira: Parsed data structure:', {
      hasMeta: !!parsed.meta,
      version: parsed.meta?.v,
      hasContent: !!parsed.content,
      contentLength: parsed.content?.length
    });
    
    // Check if this is a V3 MiraResponse
    if (parsed.meta?.v === 3) {
      console.log('✅ parseMira: Successfully identified V3 MiraResponse');
      
      // Convert V3 format to frontend-compatible format
      const frontendFormat = {
        content: parsed.content,
        title: parsed.content?.split('\n')[0]?.replace(/^#+\s*/, '') || 'AI Enhanced',
        aiBody: parsed.content,
        perspective: `AI Analysis (${parsed.meta.processingTimeMs}ms)`,
        tasks: parsed.tasks || [],
        links: parsed.links || [],
        reminders: parsed.reminders || [],
        entities: parsed.entities || [],
        media: parsed.media || [],
        quickInsights: parsed.content ? [parsed.content.split('\n')[0]] : [],
        recommendedActions: (parsed.tasks || []).map((task: any) => task.title),
        nextSteps: (parsed.tasks || []).map((task: any) => task.title),
        // Keep original V3 data
        miraV3: parsed
      };
      
      console.log('✅ parseMira: Converted V3 to frontend format:', {
        hasContent: !!frontendFormat.content,
        hasAiBody: !!frontendFormat.aiBody,
        contentLength: frontendFormat.content?.length,
        tasksCount: frontendFormat.tasks?.length
      });
      
      return frontendFormat;
    }
    
    console.log('❌ parseMira: Not a V3 MiraResponse - meta.v =', parsed.meta?.v);
    return null;
  } catch (error) {
    console.error('❌ parseMira: Failed to parse MiraResponse:', error);
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