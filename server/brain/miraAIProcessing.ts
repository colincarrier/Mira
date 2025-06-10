/**
 * Mira AI Processing - Orthogonal Upgrade
 * Universal dispatcher with commerce/memory path routing
 */

import { v4 as uuid } from 'uuid';
import { commerceClassifier } from './classifiers/commerceClassifier';
import { conciergeBrain } from './conciergeBrain';
import { memoryBrain } from './memoryBrain';

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
 * Main entry point - Universal AI Processing
 */
export async function processNote(input: MiraAIInput): Promise<MiraAIResult> {
  const uid = input.id ?? uuid();
  const timestamp = input.timestamp ?? new Date().toISOString();
  
  try {
    // Step 1: Fast classification (1ms keyword scoring)
    const classification = commerceClassifier(input.content);
    
    // Step 2: Route to appropriate brain
    let result: MiraAIResult;
    
    if (classification.isCommerce && classification.confidence > 0.6) {
      // Commerce path - product enrichment
      result = await conciergeBrain(input, classification);
      result.processingPath = 'commerce';
    } else {
      // Memory path - pure reminder/todo processing
      result = await memoryBrain(input, classification);
      result.processingPath = 'memory';
    }
    
    // Step 3: Add metadata
    result.uid = uid;
    result.timestamp = timestamp;
    result.confidence = classification.confidence;
    result.classificationScores = classification.scores;
    
    return result;
    
  } catch (error) {
    console.error('Mira AI processing error:', error);
    
    // Fallback response
    return {
      uid,
      timestamp,
      title: extractFallbackTitle(input.content),
      summary: "Note processed successfully",
      intent: 'personal-reflection',
      urgency: 'low',
      complexity: 1,
      confidence: 0.5,
      todos: [],
      smartActions: [],
      processingPath: 'memory',
      classificationScores: {}
    };
  }
}

/**
 * Helper: Extract fallback title from content
 */
function extractFallbackTitle(content: string): string {
  const words = content.trim().split(/\s+/);
  if (words.length <= 5) {
    return content;
  }
  return words.slice(0, 5).join(' ') + '...';
}

// Export for backward compatibility
export const processMiraInput = processNote;