// ---------- server/ai/v3/vendor/openai-client.ts ------------
// OpenAI client for V3 Help-First processing

import OpenAI from 'openai';
import type { MiraResponse } from '../../../../shared/mira-response';
import type { IntentMeta } from '../intent-classifier';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Call OpenAI with V3 Help-First prompts
 * Uses GPT-4 Turbo for better reasoning and recursion capability
 */
export async function callOpenAIV3(prompt: string, intent: IntentMeta): Promise<MiraResponse> {
  try {
    console.log(`🤖 [V3] Calling OpenAI GPT-4 Turbo with ${intent.primary} intent`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // Upgraded from gpt-3.5 for better reasoning
      messages: [
        { 
          role: 'system', 
          content: 'You are Mira. Return ONLY valid JSON conforming to MiraResponse schema. No markdown formatting.' 
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more focused responses
      max_tokens: getTokenBudgetForIntent(intent), // Dynamic token limits
    });

    const result = completion.choices[0].message.content;
    if (!result) {
      throw new Error('Empty response from OpenAI');
    }

    console.log(`✅ [V3] OpenAI response: ${result.length} chars`);
    
    // Parse and validate JSON
    const parsed = JSON.parse(result) as MiraResponse;
    
    // Ensure required fields exist
    return {
      content: parsed.content || '',
      tasks: (parsed.tasks || []).slice(0, 3), // Enforce max 3 tasks
      links: parsed.links || [],
      reminders: parsed.reminders || [],
      entities: parsed.entities || [],
      media: parsed.media || [],
      meta: {
        model: 'gpt-4-turbo-preview',
        confidence: intent.confidence,
        processingTimeMs: 0, // Will be set by worker
        intent: intent.primary.toLowerCase() as any,
        v: 3
      },
      thread: parsed.thread || []
    };
    
  } catch (error) {
    console.error(`❌ [V3] OpenAI call failed:`, error);
    
    // Return fallback response
    return {
      content: `# Analysis Complete\n\nProcessed: "${prompt.substring(0, 100)}..."`,
      tasks: [],
      links: [],
      reminders: [],
      entities: [],
      media: [],
      meta: {
        model: 'fallback',
        confidence: 0.1,
        processingTimeMs: 0,
        intent: intent.primary.toLowerCase() as any,
        v: 3
      },
      thread: []
    };
  }
}

/**
 * Get token budget based on intent complexity
 */
function getTokenBudgetForIntent(intent: IntentMeta): number {
  const budgets = {
    IMMEDIATE_PROBLEM: { simple: 800, moderate: 1200, complex: 1800 },
    TIME_SENSITIVE: { simple: 400, moderate: 600, complex: 900 },
    RESEARCH: { simple: 1000, moderate: 1500, complex: 2500 },
    COLLECTION: { simple: 300, moderate: 500, complex: 800 },
    GENERAL: { simple: 400, moderate: 600, complex: 900 }
  };
  
  return budgets[intent.primary][intent.depth];
}