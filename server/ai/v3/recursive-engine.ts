// ---------- server/ai/v3/recursive-engine.ts ------------
// Recursive reasoning engine for V3 Help-First processing

import { storage } from '../../storage';
import { callOpenAIV3 } from './vendor/openai-client';
import type { IntentMeta } from './intent-classifier';
import type { MiraResponse } from '../../../shared/mira-response';

export interface UserContext {
  bio?: string;
  relevantFacts?: string[];
  preferences?: Record<string, any>;
  recentNotes?: string[];
}

export interface RecursiveContext {
  userId: string;
  originalInput: string;
  intent: IntentMeta;
  userContext: UserContext;
  recursionDepth: number;
  maxDepth: number;
}

/**
 * Recursive reasoning engine with quality guard and adaptive prompting
 */
export class RecursiveEngine {
  private readonly MAX_DEPTH = 3;
  private readonly MARGINAL_VALUE_THRESHOLD = 0.30; // 30% improvement required for recursion

  /**
   * Main entry point for recursive processing
   */
  async processWithRecursion(context: RecursiveContext): Promise<MiraResponse> {
    console.log(`🔄 [RecursiveEngine] Starting depth ${context.recursionDepth}/${context.maxDepth}`);

    // Generate adaptive prompt based on context and depth
    const prompt = await this.buildAdaptivePrompt(context);
    
    // Get initial response from OpenAI
    const response = await callOpenAIV3(prompt, context.intent);
    
    // Quality guard - check if response is generic
    if (this.isGenericResponse(response.content || '')) {
      console.log(`⚠️ [RecursiveEngine] Generic response detected at depth ${context.recursionDepth}`);
      
      // If we haven't reached max depth, try recursion
      if (context.recursionDepth < context.maxDepth) {
        console.log(`🔄 [RecursiveEngine] Attempting recursive enhancement...`);
        return await this.attemptRecursion(context, response);
      }
      
      // Fallback to safe response
      console.log(`❌ [RecursiveEngine] Max depth reached, using fallback`);
      return this.createFallbackResponse(context.originalInput);
    }

    // Check if recursion would add value
    if (context.recursionDepth < context.maxDepth && this.shouldRecurse(response, context)) {
      console.log(`🔄 [RecursiveEngine] Value-driven recursion triggered`);
      return await this.attemptRecursion(context, response);
    }

    console.log(`✅ [RecursiveEngine] Completed at depth ${context.recursionDepth}`);
    return response;
  }

  /**
   * Build adaptive prompt based on recursion depth and context
   */
  private async buildAdaptivePrompt(context: RecursiveContext): Promise<string> {
    const { userId, originalInput, intent, recursionDepth } = context;
    
    // Get user patterns for personalization
    const userPatterns = await storage.getUserPatterns(userId);
    const collectionHints = await storage.getCollectionHints(originalInput);
    const recentNotes = await storage.getRecentNotes(userId, 5);
    
    // Depth-specific instructions
    const depthInstructions = this.getDepthInstructions(recursionDepth, intent);
    
    return `
You are **Mira**, a super-intelligent assistant whose ONLY job is to **solve the user's problem**.

CORE RULES:
1. Identify the real need behind the input and HELP immediately
2. For "lost airpod" → Find My link + local replacement prices
3. For "harry potter tix" → Actual show times and ticket links
4. For "pick up milk" → Simple reminder, no research
5. NEVER create more than 3 explicit todos per note
6. Return full markdown responses - NO artificial length limits
7. For problems: provide solutions, not explanations
8. For research: provide answers, not research plans

PROCESSING DEPTH: ${recursionDepth + 1}/${this.MAX_DEPTH}
${depthInstructions}

INTENT ANALYSIS:
- Primary: ${intent.primary}
- Urgency: ${intent.urgency} 
- Depth: ${intent.depth}
- Confidence: ${intent.confidence}

USER CONTEXT:
- Recent activity: ${userPatterns.activityLevel} notes
- Preferred modes: ${JSON.stringify(userPatterns.preferredModes)}
- Collection hints: ${collectionHints.map(h => h.name).join(', ') || 'none'}
- Recent topics: ${recentNotes.map(n => n.content.substring(0, 30)).join('; ')}

INPUT TO SOLVE:
"${originalInput}"

RESPONSE REQUIREMENTS:
- Return ONLY valid JSON following MiraResponse schema
- content: Rich markdown with actionable solutions
- tasks: Maximum 3 specific, actionable items (only if truly needed)
- links: Actual helpful URLs when relevant
- reminders: Specific time-based actions if mentioned
- meta: Include confidence, processing time, intent

${this.getIntentSpecificGuidance(intent.primary)}

BEGIN SOLVING:
`.trim();
  }

  /**
   * Get depth-specific processing instructions
   */
  private getDepthInstructions(depth: number, intent: IntentMeta): string {
    switch (depth) {
      case 0:
        return `DEPTH 1 FOCUS: Provide immediate, practical help. If this is a problem, solve it. If it's research, find answers.`;
      case 1:
        return `DEPTH 2 FOCUS: The initial response was generic. Dig deeper. Find specific data, prices, locations, contact info.`;
      case 2:
        return `DEPTH 3 FOCUS: Maximum effort. This is the final attempt. Provide comprehensive, actionable intelligence.`;
      default:
        return `STANDARD PROCESSING: Provide helpful, specific assistance.`;
    }
  }

  /**
   * Get intent-specific guidance
   */
  private getIntentSpecificGuidance(intentType: string): string {
    switch (intentType) {
      case 'IMMEDIATE_PROBLEM':
        return `
IMMEDIATE PROBLEM GUIDANCE:
- Find actual solutions, not suggestions to "contact support"
- Include specific steps, links, phone numbers
- Anticipate follow-up needs`;

      case 'RESEARCH':
        return `
RESEARCH GUIDANCE:
- Provide actual data, not research methodologies
- Include specific comparisons, prices, reviews
- Synthesize information into actionable insights`;

      case 'TIME_SENSITIVE':
        return `
TIME-SENSITIVE GUIDANCE:
- Provide immediate next steps
- Include specific deadlines and schedules
- Create actionable reminders`;

      default:
        return `
GENERAL GUIDANCE:
- Be helpful and specific
- Avoid generic advice
- Focus on actionable outcomes`;
    }
  }

  /**
   * Attempt recursive enhancement
   */
  private async attemptRecursion(
    context: RecursiveContext, 
    previousResponse: MiraResponse
  ): Promise<MiraResponse> {
    // Create follow-up prompt for recursion
    const recursionPrompt = `
The initial response was: ${JSON.stringify(previousResponse, null, 2)}

RECURSION TASK: Enhance this response with missing critical information.

Focus on what's missing:
- Specific prices, locations, contact information
- Direct links to actual services/products
- Immediate actionable steps
- Concrete data instead of general advice

Original request: "${context.originalInput}"

Return an ENHANCED MiraResponse with the additional valuable information integrated naturally.
DO NOT repeat generic advice. ADD specific, actionable intelligence.
`;

    // Recursive call with increased depth
    const enhancedContext: RecursiveContext = {
      ...context,
      recursionDepth: context.recursionDepth + 1
    };

    const enhancedResponse = await callOpenAIV3(recursionPrompt, context.intent);
    
    // Merge responses intelligently
    return this.mergeResponses(previousResponse, enhancedResponse);
  }

  /**
   * Check if response is generic (quality guard)
   */
  private isGenericResponse(content: string): boolean {
    const genericPhrases = [
      /visit official website/i,
      /check their website/i,
      /contact.*directly/i,
      /subject to availability/i,
      /various options available/i,
      /consult.*professional/i,
      /may vary/i
    ];

    const hasSpecificData = /\$[\d,]+|\d{1,2}:\d{2}|https?:\/\/[\w.-]+|Section \d+|\d+ (miles?|km|minutes?|hours?)/;
    const isSubstantial = content.length > 100;

    const isGeneric = genericPhrases.some(phrase => phrase.test(content));
    const hasValue = hasSpecificData.test(content) && isSubstantial;

    return isGeneric && !hasValue;
  }

  /**
   * Determine if recursion would add marginal value
   */
  private shouldRecurse(response: MiraResponse, context: RecursiveContext): boolean {
    const content = response.content || '';
    
    // Calculate marginal value score
    const specificDataScore = this.calculateSpecificDataScore(content);
    const actionabilityScore = this.calculateActionabilityScore(response);
    const noveltyScore = this.calculateNoveltyScore(content, context);
    
    const marginalValue = (specificDataScore + actionabilityScore + noveltyScore) / 3;
    
    console.log(`📊 [RecursiveEngine] Marginal value: ${marginalValue.toFixed(2)} (threshold: ${this.MARGINAL_VALUE_THRESHOLD})`);
    
    return marginalValue < this.MARGINAL_VALUE_THRESHOLD;
  }

  /**
   * Calculate specific data score (0-1)
   */
  private calculateSpecificDataScore(content: string): number {
    const specificPatterns = [
      /\$[\d,]+/g, // Prices
      /\d{1,2}:\d{2}/g, // Times
      /https?:\/\/[\w.-]+/g, // URLs
      /\d+ (miles?|km|minutes?|hours?)/g, // Distances/durations
      /@[\w.-]+\.[\w]+/g, // Email addresses
      /\(\d{3}\) ?\d{3}-\d{4}/g // Phone numbers
    ];

    const matches = specificPatterns.reduce((count, pattern) => {
      return count + (content.match(pattern) || []).length;
    }, 0);

    return Math.min(matches / 5, 1.0); // Normalize to 0-1
  }

  /**
   * Calculate actionability score (0-1)
   */
  private calculateActionabilityScore(response: MiraResponse): number {
    const taskCount = response.tasks?.length || 0;
    const linkCount = response.links?.length || 0;
    const reminderCount = response.reminders?.length || 0;
    
    const actionItems = taskCount + linkCount + reminderCount;
    return Math.min(actionItems / 3, 1.0); // Normalize to 0-1
  }

  /**
   * Calculate novelty score (0-1)
   */
  private calculateNoveltyScore(content: string, context: RecursiveContext): number {
    // Simple novelty check - could be enhanced with semantic similarity
    const contentWords = new Set(content.toLowerCase().split(/\s+/));
    const inputWords = new Set(context.originalInput.toLowerCase().split(/\s+/));
    
    const newWords = Array.from(contentWords).filter(word => !inputWords.has(word) && word.length > 3);
    const noveltyRatio = newWords.length / Math.max(contentWords.size, 1);
    
    return Math.min(noveltyRatio * 2, 1.0); // Boost novelty importance
  }

  /**
   * Merge two responses intelligently
   */
  private mergeResponses(original: MiraResponse, enhanced: MiraResponse): MiraResponse {
    // Use enhanced content if significantly better, otherwise merge
    const content = this.mergeContent(original.content || '', enhanced.content || '');
    
    return {
      content,
      tasks: [...(original.tasks || []), ...(enhanced.tasks || [])].slice(0, 3), // Max 3 tasks
      links: [...(original.links || []), ...(enhanced.links || [])],
      reminders: [...(original.reminders || []), ...(enhanced.reminders || [])],
      entities: [...(original.entities || []), ...(enhanced.entities || [])],
      media: [...(original.media || []), ...(enhanced.media || [])],
      meta: {
        ...original.meta,
        ...enhanced.meta,
        confidence: enhanced.meta?.confidence || original.meta?.confidence || 0.8,
        processingTimeMs: (enhanced.meta?.processingTimeMs || 0) + (original.meta?.processingTimeMs || 0)
      },
      thread: [...(original.thread || []), ...(enhanced.thread || [])]
    };
  }

  /**
   * Merge content intelligently
   */
  private mergeContent(original: string, enhanced: string): string {
    // If enhanced response is significantly longer and contains new info, use it
    if (enhanced.length > original.length * 1.5) {
      return enhanced;
    }
    
    // Otherwise, append enhanced info to original
    const separator = original.endsWith('\n') ? '\n' : '\n\n';
    return original + separator + '**Additional Information:**\n' + enhanced;
  }

  /**
   * Create fallback response for failed cases
   */
  private createFallbackResponse(originalInput: string): MiraResponse {
    return {
      content: `I need more context to help with "${originalInput}". Could you provide more specific details about what you're looking for?`,
      tasks: [],
      links: [],
      reminders: [],
      entities: [],
      media: [],
      meta: {
        confidence: 0.3,
        processingTimeMs: 0,
        model: 'gpt-4-turbo-preview',
        intentType: 'general',
        v: 3
      },
      thread: []
    };
  }
}