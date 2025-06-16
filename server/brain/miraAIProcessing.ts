/**
 * Intelligence-V2 Integration
 */
// ─────────────────────────────────────────────────────────────────────────────
// V2 COMPONENT SINGLETONS
import OpenAI from 'openai';
import { IntelligenceV2Router } from '../intelligence-v2/intelligence-router';
import { FeatureFlagManager } from '../intelligence-v2/feature-flags';

// Initialize Intelligence-V2 system
console.log('Environment check:', {
  FEATURE_INTELLIGENCE_V2: process.env.FEATURE_INTELLIGENCE_V2,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'present' : 'missing'
});

const featureFlags = FeatureFlagManager.getInstance();

let intelligenceV2Router: IntelligenceV2Router | null = null;
if (featureFlags.isEnabled('INTELLIGENCE_V2_ENABLED')) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  intelligenceV2Router = new IntelligenceV2Router(openai);
  console.log('✅ [Bootstrap] Intelligence‑V2 router initialised successfully');
} else {
  console.log('❌ [Bootstrap] Intelligence‑V2 disabled by env flag');
  featureFlags.logFlagStatus();
}

/**
 * Enhanced time detection for reminder creation
 */
function detectTimeReferences(content: string): {
  hasTimeReference: boolean;
  extractedTimes: string[];
  isUrgent: boolean;
  shouldCreateReminder: boolean;
} {
  const contentLower = content.toLowerCase();

  // Explicit reminder phrases
  const reminderPhrases = [
    'remind me', 'reminder', 'don\'t forget', 'remember to', 'make sure to',
    'need to remember', 'schedule', 'appointment', 'meeting'
  ];

  // Time expressions
  const timeExpressions = [
    'tomorrow', 'today', 'tonight', 'this morning', 'this afternoon', 'this evening',
    'next week', 'next month', 'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday', 'in \\d+ (hours?|days?|weeks?)', 
    'at \\d+:?\\d*\\s*(am|pm)?', 'by \\w+', 'before \\w+', 'after \\w+'
  ];

  // Urgency indicators
  const urgencyWords = [
    'urgent', 'important', 'deadline', 'due', 'asap', 'immediately', 
    'critical', 'priority', 'must', 'need to'
  ];

  const hasExplicitReminder = reminderPhrases.some(phrase => 
    contentLower.includes(phrase)
  );

  const extractedTimes = timeExpressions.filter(pattern => 
    new RegExp(pattern, 'i').test(content)
  );

  const isUrgent = urgencyWords.some(word => 
    contentLower.includes(word)
  );

  const hasTimeReference = extractedTimes.length > 0 || hasExplicitReminder;
  const shouldCreateReminder = hasExplicitReminder || (hasTimeReference && isUrgent);

  return {
    hasTimeReference,
    extractedTimes,
    isUrgent,
    shouldCreateReminder
  };
}


/**
 * Mira AI Processing - Orthogonal Upgrade
 * Universal dispatcher with commerce/memory path routing
 */

import { v4 as uuid } from 'uuid';

export interface MiraAIInput {
  content: string;
  mode: 'text' | 'image' | 'voice';
  imageData?: string;
  userContext?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
  timestamp?: string;
  id?: string;
  req?: any;
}

export interface MiraAIResult {
  uid: string;
  timestamp: string;
  title: string;
  summary: string;
  intent: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexity: number;
  confidence: number;

  // Core outputs
  todos: Array<{
    title: string;
    priority: string;
    due?: string;
  }>;

  // New: Separate reminders with time instructions
  reminders?: Array<{
    title: string;
    datetime: string;
    type: 'reminder';
  }>;

  smartActions: Array<{
    label: string;
    action: string;
    url?: string;
  }>;

  // New: Time instructions for Mira to understand
  timeInstructions?: {
    hasTimeReference: boolean;
    extractedTimes: string[];
    scheduledItems: string[];
  };

  // Enhanced outputs
  assistantAddendum?: string;
  enrichments?: {
    products?: Array<{
      name: string;
      price: string;
      url: string;
      rating?: string;
    }>;
    locations?: Array<{
      name: string;
      address: string;
      distance: string;
    }>;
  };

  // Routing metadata
  processingPath: 'commerce' | 'memory';
  classificationScores: Record<string, number>;

  // Legacy compatibility
  fromTheWeb?: any[];
  _rawModelJSON?: any;
}

/**
 * Fast commerce classification using keyword scoring
 */
function commerceClassifier(content: string): {
  isCommerce: boolean;
  confidence: number;
  scores: Record<string, number>;
  primaryIntent: string;
} {
  const contentLower = content.toLowerCase();

  // Commerce keywords weighted by specificity
  const commerceKeywords = {
    buy: 1.0, purchase: 1.0, order: 0.9, shopping: 0.9, store: 0.8,
    price: 0.9, cost: 0.8, sale: 0.9, discount: 0.8, deals: 0.8,
    best: 0.7, cheap: 0.7, affordable: 0.7, review: 0.6, compare: 0.7,
    headphones: 0.8, laptop: 0.8, phone: 0.8, tv: 0.8, shoes: 0.7,
    wireless: 0.6, bluetooth: 0.6, under: 0.5, dollars: 0.7, budget: 0.6
  };

  let commerceScore = 0;
  let totalMatches = 0;

  // Score commerce keywords
  for (const [keyword, weight] of Object.entries(commerceKeywords)) {
    if (contentLower.includes(keyword)) {
      commerceScore += weight;
      totalMatches++;
    }
  }

  // Boost for price patterns ($X, €X, £X)
  if (/[\$€£¥]\s*[\d,]+/.test(content)) {
    commerceScore += 0.7;
  }

  // Boost for comparison language
  if (/\b(vs|versus|compared? to|better than)\b/.test(contentLower)) {
    commerceScore += 0.5;
  }

  const confidence = Math.min(Math.max(commerceScore / Math.max(totalMatches, 1), 0), 1);

  return {
    isCommerce: commerceScore > 0.4,
    confidence,
    scores: { commerce: commerceScore },
    primaryIntent: commerceScore > 0.4 ? 'product-query' : 'simple-task'
  };
}

/**
 * Commerce path - product enrichment
 */
async function processCommerceQuery(input: MiraAIInput): Promise<MiraAIResult> {
  const openaiModule = await import('../openai');

  const commercePrompt = `
SYSTEM: You are Mira's shopping assistant. Analyze this product query and provide shopping assistance.

USER_QUERY: "${input.content}"

REQUIRED_JSON_OUTPUT:
{
  "title": "string (3-5 words, product-focused)",
  "summary": "string (shopping analysis)",
  "intent": "product-query",
  "urgency": "medium",
  "complexity": 6,
  "todos": [{"title": "research options", "priority": "medium"}],
  "smartActions": [{"label": "Research Online", "action": "openLink", "url": "https://www.google.com/search?q=${encodeURIComponent(input.content + ' buy')}"}],
  "assistantAddendum": "I can help you research and find the best options for this product query."
}

OUTPUT ONLY JSON:`;

  try {
    const result = await openaiModule.analyzeWithOpenAI(commercePrompt, 'enhanced');

    // Try to parse JSON response from enhancedContent
    let parsedResult = null;
    try {
      if (result.enhancedContent) {
        parsedResult = JSON.parse(result.enhancedContent);
      }
    } catch (parseError) {
      console.log('Could not parse commerce JSON, using fallback');
    }

    // Use the actual enhanced content from OpenAI instead of fallback summary
    let enhancedContent = result.enhancedContent || "Product analysis completed";

    // Clean only if it contains instruction text, but preserve rich content
    if (enhancedContent.includes("Generate comprehensive") || enhancedContent.includes("COMPREHENSIVE MARKDOWN CONTENT")) {
      enhancedContent = "Product research and comparison analysis completed";
    }

    return {
      uid: '',
      timestamp: '',
      title: parsedResult?.title || extractProductTitle(input.content),
      summary: enhancedContent, // Use the rich enhanced content here
      intent: parsedResult?.intent || 'product-query',
      urgency: parsedResult?.urgency || 'medium',
      complexity: parsedResult?.complexity || 6,
      confidence: 0.8,
      todos: parsedResult?.todos || [{title: `Research ${input.content}`, priority: 'medium'}],
      smartActions: parsedResult?.smartActions || [{
        label: 'Research Online',
        action: 'openLink',
        url: `https://www.google.com/search?q=${encodeURIComponent(input.content + ' buy review')}`
      }],
      assistantAddendum: parsedResult?.assistantAddendum || `I can help you research and find the best options for: ${input.content}`,
      enrichments: {
        products: [{
          name: `Research needed for: ${input.content}`,
          price: 'Price comparison required',
          url: `https://www.google.com/search?q=${encodeURIComponent(input.content + ' price')}`,
          rating: 'Reviews pending'
        }]
      },
      processingPath: 'commerce',
      classificationScores: { commerce: 0.8 },
      _rawModelJSON: result
    };
  } catch (error) {
    console.error('Commerce processing error:', error);
    return createFallbackResult(input, 'commerce');
  }
}

/**
 * Memory path - personal tasks and reminders
 */
async function processMemoryTask(input: MiraAIInput): Promise<MiraAIResult> {
  const openaiModule = await import('../openai');

  const memoryPrompt = `
SYSTEM: You are Mira's intelligent memory assistant. Extract todos and reminders with precise time information.

USER_INPUT: "${input.content}"

ANALYZE FOR TIME REFERENCES:
- Look for explicit time words: "remind me", "tomorrow", "next week", "at 2pm", "in 3 days", "by Friday"
- Look for implicit urgency: "don't forget", "important", "deadline", "due"
- Look for dates: "June 15", "Monday", "this weekend"
- Convert relative times to specific ISO datetimes when possible

CURRENT_TIME_CONTEXT: ${new Date().toISOString()}

REQUIRED_JSON_OUTPUT:
{
  "title": "string (3-5 words, newspaper style)",
  "summary": "string (brief processing note)",
  "intent": "simple-task",
  "urgency": "low|medium|high|critical",
  "complexity": "number (1-5)",
  "todos": [
    {
      "title": "exact user words for actionable task",
      "priority": "low|medium|high",
      "due": "ISO date if deadline mentioned"
    }
  ],
  "reminders": [
    {
      "title": "exact reminder text",
      "datetime": "ISO datetime when reminder should trigger",
      "type": "reminder"
    }
  ],
  "smartActions": [{"label": "Set Reminder", "action": "reminder"}],
  "timeInstructions": {
    "hasTimeReference": "boolean",
    "extractedTimes": ["array of time expressions found"],
    "scheduledItems": ["items that need scheduling"]
  }
}

PROCESSING_RULES:
1. If user says "remind me" or similar, create a reminder entry
2. If time words are present, mark hasTimeReference as true
3. For urgent/time-sensitive items, create both todo AND reminder
4. Default reminder time: if no specific time, use tomorrow 9am
5. Preserve user's exact phrasing in titles

OUTPUT ONLY JSON:`;

  try {
    const result = await openaiModule.analyzeWithOpenAI(memoryPrompt, 'simple');

    // Try to parse JSON response
    let parsedResult = null;
    try {
      if (result.enhancedContent) {
        parsedResult = JSON.parse(result.enhancedContent);
      }
    } catch (parseError) {
      console.log('Could not parse memory JSON, using fallback');
    }

    // Clean the summary to avoid instruction text appearing in UI
    let cleanSummary = parsedResult?.summary || "Note processed successfully";
    if (cleanSummary.includes("Generate comprehensive") || cleanSummary.length > 100) {
      cleanSummary = "Personal note organized and processed";
    }

    return {
      uid: '',
      timestamp: '',
      title: parsedResult?.title || extractMemoryTitle(input.content),
      summary: cleanSummary,
      intent: parsedResult?.intent || 'simple-task',
      urgency: parsedResult?.urgency || determineUrgency(input.content),
      complexity: parsedResult?.complexity || 2,
      confidence: 0.7,
      todos: parsedResult?.todos || [{title: input.content.trim(), priority: 'medium'}],
      reminders: parsedResult?.reminders || [],
      smartActions: parsedResult?.smartActions || [{label: 'Set Reminder', action: 'reminder'}],
      timeInstructions: parsedResult?.timeInstructions || {
        hasTimeReference: false,
        extractedTimes: [],
        scheduledItems: []
      },
      processingPath: 'memory',
      classificationScores: { memory: 0.7 },
      _rawModelJSON: result
    };
  } catch (error) {
    console.error('Memory processing error:', error);
    return createFallbackResult(input, 'memory');
  }
}

/**
 * Main entry point - Universal AI Processing
 */
import { storage } from '../storage.js';
export async function processNote(input: MiraAIInput): Promise<MiraAIResult> {
  const uid = input.id ?? uuid();
  const timestamp = input.timestamp ?? new Date().toISOString();

  // Switch between V1 and V2 processing  (null‑safe)
  if (
    featureFlags.isEnabled('INTELLIGENCE_V2_ENABLED') &&
    intelligenceV2Router !== null &&
    typeof intelligenceV2Router.processWithIntelligenceV2 === 'function'
  ) {
    // Assuming 'processWithIntelligenceV2' expects an object with specific properties.
    const v2Result = await intelligenceV2Router.processWithIntelligenceV2({
      content: input.content,
      mode: input.mode,
      id: uid // Use generated uid
    });

    // Map V2 result to expected V1 format for compatibility
    const analysis = v2Result.recursiveAnalysis;
    
    return {
      uid: v2Result.id,
      title: v2Result.title,
      summary: v2Result.summary,
      enhancedContent: v2Result.enhancedContent,
      intent: analysis?.immediateProcessing?.intent || 'research',
      urgency: analysis?.immediateProcessing?.urgency || 'medium',
      complexity: analysis?.immediateProcessing?.complexity || 5,
      confidence: 0.9,
      todos: analysis?.proactiveDelivery?.suggestedActions?.map(action => ({
        title: action.action,
        priority: action.priority > 7 ? 'high' : action.priority > 5 ? 'medium' : 'low'
      })) || [],
      smartActions: analysis?.proactiveDelivery?.suggestedActions?.map(action => ({
        label: action.action,
        action: action.reasoning
      })) || [],
      entities: analysis?.immediateProcessing?.entities?.map(entity => ({
        name: entity,
        type: 'general'
      })) || [],
      suggestedLinks: [],
      nextSteps: analysis?.recursiveReasoning?.step1Anticipation?.potentialActions || [],
      microQuestions: analysis?.recursiveReasoning?.step1Anticipation?.followUpQuestions || [],
      fromTheWeb: [],
      tags: analysis?.immediateProcessing?.entities || [],
      relatedTopics: analysis?.contextualIntelligence?.crossReferences?.map(ref => ref.relationship) || [],
      processingPath: 'intelligence_v2',
      classificationScores: { 
        intelligence_v2: 1.0,
        complexity: analysis?.immediateProcessing?.complexity || 0,
        confidence: 0.9
      },
      timestamp: v2Result.timestamp
    };
  }

  try {
    // Fast classification
    const classification = commerceClassifier(input.content);

    // Route to appropriate processor
    let result: MiraAIResult;

    if (classification.isCommerce && classification.confidence > 0.6) {
      result = await processCommerceQuery(input);
      result.processingPath = 'commerce';
    } else {
      result = await processMemoryTask(input);
      result.processingPath = 'memory';
    }

    // Add metadata
    result.uid = uid;
    result.timestamp = timestamp;
    result.confidence = classification.confidence;
    result.classificationScores = classification.scores;

    return result;

  } catch (error) {
    console.error('Mira AI processing error:', error);
    return createFallbackResult(input, 'memory');
  }
}

/**
 * Helper functions
 */
function extractProductTitle(content: string): string {
  const words = content.trim().split(/\s+/);
  return words.slice(0, 4).join(' ') + (words.length > 4 ? ' Search' : '');
}

function extractMemoryTitle(content: string): string {
  const words = content.trim().split(/\s+/);
  return words.length <= 5 ? content : words.slice(0, 4).join(' ') + '...';
}

function determineUrgency(content: string): 'low' | 'medium' | 'high' | 'critical' {
  const contentLower = content.toLowerCase();
  if (/\b(urgent|asap|emergency|immediately|now)\b/.test(contentLower)) return 'critical';
  if (/\b(today|tonight|this morning|this afternoon)\b/.test(contentLower)) return 'high';
  if (/\b(tomorrow|this week|soon|deadline)\b/.test(contentLower)) return 'medium';
  return 'low';
}

function createFallbackResult(input: MiraAIInput, path: 'commerce' | 'memory'): MiraAIResult {
  return {
    uid: uuid(),
    timestamp: new Date().toISOString(),
    title: extractMemoryTitle(input.content),
    summary: "Note processed successfully",
    intent: path === 'commerce' ? 'product-query' : 'simple-task',
    urgency: 'low',
    complexity: path === 'commerce' ? 5 : 2,
    confidence: 0.5,
    todos: [{title: input.content.trim(), priority: 'medium'}],
    smartActions: [{label: path === 'commerce' ? 'Research Online' : 'Set Reminder', action: path === 'commerce' ? 'openLink' : 'reminder'}],
    processingPath: path,
    classificationScores: {}
  };
}

// Export for backward compatibility
export const processMiraInput = processNote;