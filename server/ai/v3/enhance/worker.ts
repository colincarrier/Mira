// ---------- server/ai/v3/enhance/worker.ts ------------
// V3 Help-First enhancement worker

import { pool } from '../../../db';
import { classifyIntent } from '../intent-classifier';
import { buildHelpFirstPrompt } from '../help-first-prompt';
import { callOpenAI } from '../openai';
import { RecursiveEngine } from '../reasoning/recursive-engine';
import { broadcastToNote } from '../realtime/sse-manager';
import { extractTasks } from '../utils/extract-tasks';
import { extractLinks } from '../utils/extract-links';
import { enrichLinks, extractUrls } from '../../link-enrichment';
import { getUserPatterns, getCollectionHints, getRecentNotes } from '../../../storage';
import type { MiraResponse } from '../../../../shared/types';

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
    const context: UserContext = {
      recentNotes: await getRecentNotes(note.user_id || 'demo', 5),
      userPatterns: await getUserPatterns(note.user_id || 'demo'),
      preferences: {},
      bio: undefined
    };
    
    // Classify intent using V3 classifier
    const intent = classifyIntent(note.content);
    console.log(`🧠 [V3] Intent classified as: ${intent.primary} (${intent.depth}, ${intent.urgency})`);
    
    // Build Help-First prompt
    const prompt = buildHelpFirstPrompt(note.content, context, intent);
    
    // Extract URLs and enrich links in parallel with AI processing
    const urls = extractUrls(note.content);
    const startTime = Date.now();
    const model = process.env.MIRA_AI_MODEL || 'gpt-4o';
    
    // Enhanced error handling with retry logic
    const maxRetries = 3;
    let checked = '';
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        checked = await callOpenAI(prompt, { model, maxTokens: 1900 });
        break;
      } catch (err) {
        if (attempt === maxRetries) {
          console.error('[AI] all retries failed', err);
          checked = note.content;
          break;
        }
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
    
    const enrichedLinks = await enrichLinks(urls);
    
    // Parse JSON if LLM wrapped it in ```json```
    let parsedContent = checked;
    let extractedTasks = extractTasks(checked);

    const match = checked.match(/```json\s*\n([\s\S]*?)\n```/);
    if (match) {
      try {
        const j = JSON.parse(match[1]);
        parsedContent = j.content ?? parsedContent;
        extractedTasks = Array.isArray(j.tasks) ? j.tasks : extractedTasks;
      } catch { /* best-effort only */ }
    }

    const processingTime = Date.now() - startTime;
    const miraResponse: MiraResponse = {
      content: parsedContent,
      tasks: extractedTasks,
      links: [],
      reminders: [],
      entities: [],
      media: [],
      enrichedLinks: extractLinks(parsedContent),
      meta: {
        model: 'gpt-4o',
        confidence: 0.8,
        processingTimeMs: processingTime,
        intent: intent.primary,
        v: 3
      },
      thread: []
    };
    
    console.log(`✅ [V3] Generated response with ${miraResponse.content?.length || 0} chars, ${miraResponse.tasks?.length || 0} tasks`);
    
    // Store in mira_response column (V3 format)
    await client.query(
      `UPDATE notes 
       SET mira_response = $1::jsonb,
           ai_enhanced = true
       WHERE id = $2`,
      [miraResponse, noteId]
    );

    // Broadcast real-time update to client
    broadcastToNote(noteId, {
      type: 'enhancement_complete',
      content: miraResponse.content,
      tasks: miraResponse.tasks,
      timestamp: Date.now(),
      processingTime
    });
    
    console.log(`✅ [V3] Note ${noteId} processed successfully in ${processingTime}ms`);
    
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