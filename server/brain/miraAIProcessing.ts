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
  
  smartActions: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  
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
    buy: 0.9, purchase: 0.9, order: 0.8, shopping: 0.8, store: 0.7,
    price: 0.8, cost: 0.7, sale: 0.8, discount: 0.7, deals: 0.7,
    best: 0.6, cheap: 0.6, affordable: 0.6, review: 0.5, compare: 0.6,
    tv: 0.5, laptop: 0.5, phone: 0.5, headphones: 0.4, shoes: 0.4
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
    isCommerce: commerceScore > 0.6,
    confidence,
    scores: { commerce: commerceScore },
    primaryIntent: commerceScore > 0.6 ? 'product-query' : 'simple-task'
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
    
    return {
      uid: '',
      timestamp: '',
      title: result.enhancedContent || extractProductTitle(input.content),
      summary: result.context || "Product query analyzed",
      intent: 'product-query',
      urgency: 'medium',
      complexity: 6,
      confidence: 0.8,
      todos: [{title: `Research ${input.content}`, priority: 'medium'}],
      smartActions: [{
        label: 'Research Online',
        action: 'openLink',
        url: `https://www.google.com/search?q=${encodeURIComponent(input.content + ' buy review')}`
      }],
      assistantAddendum: `I can help you research and find the best options for: ${input.content}`,
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
SYSTEM: You are Mira's memory assistant. Process this personal note focusing on task organization.

USER_INPUT: "${input.content}"

REQUIRED_JSON_OUTPUT:
{
  "title": "string (3-5 words, newspaper style)",
  "summary": "string (brief note)",
  "intent": "simple-task",
  "urgency": "low",
  "complexity": 2,
  "todos": [{"title": "exact user words", "priority": "medium"}],
  "smartActions": [{"label": "Set Reminder", "action": "reminder"}]
}

RULES:
- Preserve user's exact phrasing
- Keep complexity low (1-5)
- Extract only explicit actions

OUTPUT ONLY JSON:`;

  try {
    const result = await openaiModule.analyzeWithOpenAI(memoryPrompt, 'simple');
    
    return {
      uid: '',
      timestamp: '',
      title: result.enhancedContent || extractMemoryTitle(input.content),
      summary: result.context || "Note processed",
      intent: 'simple-task',
      urgency: determineUrgency(input.content),
      complexity: 2,
      confidence: 0.7,
      todos: [{title: input.content.trim(), priority: 'medium'}],
      smartActions: [{label: 'Set Reminder', action: 'reminder'}],
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
export async function processNote(input: MiraAIInput): Promise<MiraAIResult> {
  const uid = input.id ?? uuid();
  const timestamp = input.timestamp ?? new Date().toISOString();
  
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