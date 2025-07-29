/**
 * V3 MiraResponse Types - Shared between client and server
 * Unified schema replacing Intelligence V2 fragmented formats
 */

export interface MiraResponseSchema {
  content: string;
  summary?: string;
  tasks?: Array<{
    title: string;
    priority: 'low' | 'medium' | 'high';
    confidence: number;
    timing?: string;
    dueDate?: string; // ISO date string
  }>;
  entities?: Array<{
    type: 'person' | 'company' | 'location' | 'product' | 'concept';
    value: string;
    confidence: number;
    context?: string;
  }>;
  links?: Array<{
    url: string;
    title?: string;
    description?: string;
    type?: 'reference' | 'research' | 'purchase' | 'documentation';
  }>;
  reminders?: Array<{
    text: string;
    timing: string;
    confidence: number;
    category?: 'meeting' | 'deadline' | 'followup' | 'personal';
  }>;
  metadata: {
    intent: string;
    confidence: number;
    processingPath: 'clarify' | 'evolve';
    tokenUsage: number;
    model: 'gpt-4o' | 'claude-sonnet';
    timestamp: string; // ISO timestamp
    version: '3.0';
  };
}

/**
 * Intent Classification for V3 routing
 */
export type IntentType = 
  | 'clarify'       // User needs clarification, ambiguous request
  | 'evolve'        // User wants content enhancement/evolution
  | 'task'          // Task/todo creation focused
  | 'research'      // Information gathering request
  | 'reminder'      // Time-based reminder creation
  | 'organization'; // Collection/categorization request

/**
 * Processing path determines AI behavior
 */
export type ProcessingPath = 'clarify' | 'evolve';

/**
 * Token budget allocation for cost control
 */
export interface TokenBudget {
  maxInput: number;
  maxOutput: number;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Standard token budgets for different intents
 */
export const TOKEN_BUDGETS: Record<IntentType, TokenBudget> = {
  clarify: { maxInput: 2000, maxOutput: 1000, priority: 'medium' },
  evolve: { maxInput: 4000, maxOutput: 2000, priority: 'high' },
  task: { maxInput: 1500, maxOutput: 800, priority: 'medium' },
  research: { maxInput: 3000, maxOutput: 1500, priority: 'high' },
  reminder: { maxInput: 1000, maxOutput: 500, priority: 'low' },
  organization: { maxInput: 2000, maxOutput: 1000, priority: 'medium' }
};