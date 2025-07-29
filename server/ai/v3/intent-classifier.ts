// ---------- server/ai/v3/intent-classifier.ts ------------
// Intent classification for V3 Help-First processing

export type V3IntentType = 
  | 'IMMEDIATE_PROBLEM'  // Lost items, broken things, urgent fixes
  | 'TIME_SENSITIVE'     // Deadlines, appointments, urgent tasks  
  | 'RESEARCH'          // Comparisons, learning, analysis
  | 'COLLECTION'        // Saving, organizing, remembering
  | 'GENERAL';          // Everything else

export interface IntentMeta {
  primary: V3IntentType;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  depth: 'simple' | 'moderate' | 'complex';
  confidence: number;
}

export function classifyIntent(input: string): IntentMeta {
  const lower = input.toLowerCase();
  
  // IMMEDIATE_PROBLEM - needs instant help, not descriptions
  const problemKeywords = /lost|broken|can't find|missing|not working|won't start|crashed|error|failed|stuck/;
  if (problemKeywords.test(lower)) {
    return {
      primary: 'IMMEDIATE_PROBLEM',
      urgency: 'high',
      depth: 'moderate',
      confidence: 0.9
    };
  }
  
  // TIME_SENSITIVE - has deadlines or time constraints
  const timeKeywords = /today|tomorrow|asap|urgent|by \d|deadline|due|appointment|meeting|\d+(am|pm)/;
  if (timeKeywords.test(lower)) {
    return {
      primary: 'TIME_SENSITIVE', 
      urgency: 'high',
      depth: 'simple',
      confidence: 0.85
    };
  }
  
  // RESEARCH - needs deep analysis and comparison
  const researchKeywords = /research|compare|best|how to|what is|analyze|investigate|learn about|find out|study/;
  if (researchKeywords.test(lower)) {
    return {
      primary: 'RESEARCH',
      urgency: 'medium', 
      depth: 'complex',
      confidence: 0.8
    };
  }
  
  // COLLECTION - organizing and saving information
  const collectionKeywords = /save|remember|bookmark|add to list|organize|keep|store|archive|collect/;
  if (collectionKeywords.test(lower)) {
    return {
      primary: 'COLLECTION',
      urgency: 'low',
      depth: 'simple', 
      confidence: 0.75
    };
  }
  
  // GENERAL - everything else, keep it simple
  return {
    primary: 'GENERAL',
    urgency: 'low',
    depth: 'simple',
    confidence: 0.6
  };
}

// Token budgets based on intent and depth
export const TOKEN_BUDGETS = {
  IMMEDIATE_PROBLEM: { simple: 800, moderate: 1200, complex: 1800 },
  TIME_SENSITIVE: { simple: 400, moderate: 600, complex: 900 },
  RESEARCH: { simple: 1000, moderate: 1500, complex: 2500 },
  COLLECTION: { simple: 300, moderate: 500, complex: 800 },
  GENERAL: { simple: 400, moderate: 600, complex: 900 }
} as const;

export function getTokenBudget(intent: IntentMeta): number {
  return TOKEN_BUDGETS[intent.primary][intent.depth];
}