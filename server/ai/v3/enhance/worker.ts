// ---------- server/ai/v3/enhance/worker.ts ------------
// V3 Help-First enhancement worker

import { pool } from '../../../db';
import { classifyIntent } from '../intent-classifier';
import { buildHelpFirstPrompt } from '../help-first-prompt';
import { callOpenAIV3 } from '../vendor/openai-client';
import { enrichLinks, extractUrls } from '../../link-enrichment';
import { broadcastToNote } from '../../../realtime/sse-manager';
import { extractTasks } from '../utils/task-extractor';
import type { MiraResponse } from '../../../../shared/mira-response';

interface UserContext {
  bio?: string;
  relevantFacts?: string[];
  preferences?: Record<string, any>;
  recentNotes?: string[];
}

/**
 * Process a note with V3 Help-First intelligence
 */
export async function processNoteV3(noteId: number): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Get note content
    const noteResult = await client.query(
      'SELECT id, content, user_id FROM notes WHERE id = $1',
      [noteId]
    );
    
    if (noteResult.rows.length === 0) {
      throw new Error(`Note ${noteId} not found`);
    }
    
    const note = noteResult.rows[0];
    console.log(`🎯 [V3] Processing note ${noteId}: "${note.content.substring(0, 50)}..."`);
    
    // Get user context (simplified for now)
    const context: UserContext = await getUserContext(note.user_id);
    
    // Classify intent using V3 classifier
    const intent = classifyIntent(note.content);
    console.log(`🧠 [V3] Intent classified as: ${intent.primary} (${intent.depth}, ${intent.urgency})`);
    
    // Build Help-First prompt
    const prompt = buildHelpFirstPrompt(note.content, context, intent);
    
    // Extract URLs and enrich links in parallel with AI processing
    const urls = extractUrls(note.content);
    const startTime = Date.now();
    const model = process.env.MIRA_AI_MODEL || 'gpt-4o-mini';
    
    let response: MiraResponse;
    const [initialResponse, enrichedLinks] = await Promise.all([
      (async () => {
        try {
          return await callOpenAIV3(prompt, intent);
        } catch (err) {
          console.error('[AI] fast-path failed', err);
          // Graceful fallback
          return {
            content: note.content,
            tasks: extractTasks(note.content),
            links: [],
            reminders: [],
            entities: [],
            media: [],
            meta: {
              confidence: 0.3,
              processingTimeMs: Date.now() - startTime,
              model: 'fallback',
              intentType: 'general',
              v: 3
            },
            thread: []
          };
        }
      })(),
      enrichLinks(urls)
    ]);
    
    response = initialResponse;
    
    // Add enriched links from parallel processing
    response.links = [...(response.links || []), ...enrichedLinks.map(link => ({
      url: link.url,
      title: link.title,
      description: link.description,
      image: link.image || undefined
    }))];
    
    // Add processing metadata
    response.meta = {
      ...response.meta,
      processingTimeMs: Date.now() - startTime,
      intentType: intent.primary.toLowerCase() as any,
      v: 3
    };
    
    console.log(`✅ [V3] Generated response with ${response.content?.length || 0} chars, ${response.tasks?.length || 0} tasks`);
    
    // Store in mira_response column (V3 format)
    await client.query(
      `UPDATE notes 
       SET mira_response = $1::jsonb,
           ai_enhanced = true,
           is_processing = false,
           ai_context = 'V3 Help-First processing'
       WHERE id = $2`,
      [response, noteId]
    );
    
    console.log(`✅ [V3] Note ${noteId} processed successfully in ${response.meta.processingTimeMs}ms`);
    
    // Real-time broadcast to client
    broadcastToNote(noteId, {
      type: 'enhancement_complete',
      content: response.content,
      tasks: response.tasks
    });
    
  } catch (error) {
    console.error(`❌ [V3] Failed to process note ${noteId}:`, error);
    
    // Mark note as failed
    await client.query(
      `UPDATE notes 
       SET is_processing = false,
           ai_context = $1
       WHERE id = $2`,
      [`V3 processing failed: ${(error as Error).message}`, noteId]
    );
    
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get user context for personalized responses
 */
async function getUserContext(userId: string): Promise<UserContext> {
  // Simplified context for Phase 0 - expand in Phase 2
  return {
    bio: undefined,
    relevantFacts: [],
    preferences: {},
    recentNotes: []
  };
}

/**
 * Merge two MiraResponse objects (simple strategy)
 */
function mergeResponses(original: MiraResponse, enhanced: MiraResponse): MiraResponse {
  return {
    content: enhanced.content || original.content,
    tasks: [...(original.tasks || []), ...(enhanced.tasks || [])].slice(0, 3), // Max 3 tasks
    links: [...(original.links || []), ...(enhanced.links || [])],
    reminders: [...(original.reminders || []), ...(enhanced.reminders || [])],
    entities: [...(original.entities || []), ...(enhanced.entities || [])],
    media: [...(original.media || []), ...(enhanced.media || [])],
    meta: enhanced.meta || original.meta,
    thread: [...(original.thread || []), ...(enhanced.thread || [])]
  };
}