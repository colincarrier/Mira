// ---------- server/ai/v3/enhance/worker.ts ------------
// V3 Help-First enhancement worker

import { pool } from '../../../db';
import { classifyIntent } from '../intent-classifier';
import { buildHelpFirstPrompt } from '../help-first-prompt';
import { callOpenAIV3 } from '../vendor/openai-client';
import { enrichLinks, extractUrls } from '../../link-enrichment';
import { RecursiveEngine } from '../recursive-engine';
import type { MiraResponse } from '../../../../shared/mira-response';

interface UserContext {
  bio?: string;
  relevantFacts?: string[];
  preferences?: Record<string, any>;
  recentNotes?: string[];
}

// Initialize recursive engine with feature flag
const RECURSIVE_ENGINE_ENABLED = process.env.MIRA_RECURSIVE_ENGINE === 'true' || true; // TEMPORARY: Force enable for testing
const recursiveEngine = RECURSIVE_ENGINE_ENABLED ? new RecursiveEngine() : null;

console.log(`🔧 [V3] Recursive Engine: ${RECURSIVE_ENGINE_ENABLED ? 'ENABLED' : 'DISABLED'}`);

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
    
    // HYBRID ROUTING: Use RecursiveEngine for GENERAL, fast pipeline for IMMEDIATE_PROBLEM
    let response: MiraResponse;
    const startTime = Date.now();
    
    if ((intent.primary === 'GENERAL' || intent.primary === 'RESEARCH') && recursiveEngine) {
      console.log(`🔄 [V3] Using RecursiveEngine for ${intent.primary}`);
      
      // Use full recursive reasoning engine
      response = await recursiveEngine.processWithRecursion({
        userId: note.user_id,
        originalInput: note.content,
        intent,
        userContext: context,
        recursionDepth: 0,
        maxDepth: 3
      });
      
    } else {
      console.log(`⚡ [V3] Using fast pipeline for ${intent.primary}`);
      
      // Use existing fast pipeline for time-sensitive cases
      const prompt = buildHelpFirstPrompt(note.content, context, intent);
      response = await callOpenAIV3(prompt, intent);
      
      // Simple enhancement for immediate problems
      if (intent.primary === 'IMMEDIATE_PROBLEM') {
        console.log(`🔄 [V3] Applying single enhancement pass for immediate problem`);
        
        const followUpPrompt = `
Given this initial response: ${JSON.stringify(response, null, 2)}

What additional specific, actionable help would the user need? Focus on:
- Missing practical solutions
- Specific prices, locations, or contact information  
- Immediate next steps they should take

Enhance the response with this additional information. Return the complete enhanced MiraResponse.`;

        const enhancedResponse = await callOpenAIV3(followUpPrompt, intent);
        
        // Merge responses (simple strategy)
        response = mergeResponses(response, enhancedResponse);
      }
    }
    
    // Extract URLs and enrich links in parallel
    const urls = extractUrls(note.content);
    const enrichedLinks = await enrichLinks(urls);
    
    // Add enriched links from parallel processing (with proper typing)
    const allLinks = [...(response.links || []), ...enrichedLinks.map(link => ({
      url: link.url,
      title: link.title,
      description: link.description,
      image: link.image || undefined
    }))];
    response.links = allLinks;
    
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