// ==========================================
// MIRA AI - INTELLIGENCE SYSTEM
// ==========================================

// AI BRAIN PROCESSING (server/brain/miraAIProcessing.ts)
/**
 * Intelligence-V2 Integration
 */
import OpenAI from 'openai';
import { IntelligenceV2Router } from '../intelligence-v2/intelligence-router';
import { FeatureFlagManager } from '../intelligence-v2/feature-flags';

// Initialize Intelligence-V2 system
console.log('Environment check:', {
  FEATURE_INTELLIGENCE_V2: process.env.FEATURE_INTELLIGENCE_V2,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'present' : 'missing'
});

const featureFlags = FeatureFlagManager.getInstance();

let intelligenceV2Router = null;
if (featureFlags.isEnabled('INTELLIGENCE_V2_ENABLED')) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  intelligenceV2Router = new IntelligenceV2Router(openai);
  console.log('✅ [Bootstrap] Intelligence‑V2 router initialised successfully');
} else {
  console.log('❌ [Bootstrap] Intelligence‑V2 disabled by env flag');
}

// Time detection for reminder creation
function detectTimeReferences(content) {
  const contentLower = content.toLowerCase();

  const reminderPhrases = [
    'remind me', 'reminder', 'don\'t forget', 'remember to', 'make sure to',
    'need to remember', 'schedule', 'appointment', 'meeting'
  ];

  const timeExpressions = [
    'tomorrow', 'today', 'tonight', 'this morning', 'this afternoon', 'this evening',
    'next week', 'next month', 'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday', 'in \\d+ (hours?|days?|weeks?)', 
    'at \\d+:?\\d*\\s*(am|pm)?', 'by \\w+', 'before \\w+', 'after \\w+'
  ];

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

// Main processing function with V2 integration
export async function processNote(input) {
  console.log('🧠 [Mira AI] Processing note with V2 intelligence:', input.content.substring(0, 100));
  
  // CRITICAL GAP: User bio context not loaded here
  // const userProfile = await storage.getUser(input.userId || "demo");
  
  try {
    if (featureFlags.isEnabled('INTELLIGENCE_V2_ENABLED')) {
      console.log('🚀 [Mira AI] Using Intelligence V2 processing');
      return await processWithIntelligenceV2(input);
    } else {
      console.log('⚠️ [Mira AI] V2 disabled, using standard processing');
      return await processWithStandardMethod(input);
    }
  } catch (error) {
    console.error('❌ [Mira AI] Processing failed:', error);
    return await generateFallbackResult(input);
  }
}

// ==========================================
// INTELLIGENCE V2 ROUTER (server/intelligence-v2/intelligence-router.ts)
// ==========================================

import { VectorEngine } from './vector-engine.js';
import { RecursiveReasoningEngine } from './recursive-reasoning-engine.js';
import { IntentVectorClassifier } from './intent-vector-classifier.js';
import { CollectionsExtractor } from './collections-extractor.js';
import { FEATURE_FLAGS } from '../feature-flags-runtime.js';
import { storage } from '../storage.js';
import { makeTitle } from '../utils/title-governor.js';

export class IntelligenceV2Router {
  constructor(openai) {
    this.vector = new VectorEngine(openai);
    this.reason = new RecursiveReasoningEngine(openai, this.vector);
  }

  async processNoteV2(input) {
    console.log('🧠 [V2] Processing:', input.content.substring(0, 100));
    
    // CRITICAL GAP: No user context loaded
    // const userProfile = await storage.getUser(input.userId || "demo");
    // const userBio = userProfile?.personalBio;
    
    const intent = await IntentVectorClassifier.classify(input.content);
    const notes = await storage.getAllNotes();
    const matches = await this.vector.performSemanticSearch({query: input.content, limit: 10}, notes);

    if (FEATURE_FLAGS.ENHANCED_COLLECTIONS_ENABLED) {
      await CollectionsExtractor.extract(input.id ?? '', input.content);
    }

    let analysis;
    if (FEATURE_FLAGS.RECURSIVE_REASONING_ENABLED) {
      try {
        analysis = await this.reason.performRecursiveAnalysis(input.content, {}, matches, {});
      } catch (e) {
        console.warn('Recursion failed', e);
      }
    }

    if (input.id) {
      this.vector.updateNoteVectors(Number(input.id), input.content, storage).catch(() => {});
    }

    return {
      id: input.id ?? 'temp',
      title: makeTitle(input.content),
      summary: analysis?.immediateProcessing?.understanding ?? 'Intelligence‑V2 processed',
      enhancedContent: input.content,
      timestamp: new Date().toISOString(),
      entities: [],
      suggestedLinks: [],
      nextSteps: [],
      microQuestions: [],
      fromTheWeb: [],
      timeInstructions: {
        hasTimeReference: false,
        extractedTimes: [],
        scheduledItems: []
      },
      processingPath: "memory",
      classificationScores: { memory: 1 }
    };
  }
}

// Singleton export
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
const singleton = new IntelligenceV2Router(openai);
export async function processWithIntelligenceV2(input) { 
  return singleton.processNoteV2(input);
}

// ==========================================
// FEATURE FLAGS RUNTIME (server/feature-flags-runtime.ts)
// ==========================================

export const FEATURE_FLAGS = {
  INTELLIGENCE_V2_ENABLED: process.env.FEATURE_INTELLIGENCE_V2 !== 'false',
  VECTOR_SEARCH_ENABLED: process.env.FEATURE_VECTOR_SEARCH !== 'false',
  RECURSIVE_REASONING_ENABLED: process.env.FEATURE_RECURSIVE_REASONING !== 'false',
  RELATIONSHIP_MAPPING_ENABLED: process.env.FEATURE_RELATIONSHIP_MAPPING !== 'false',
  PROACTIVE_DELIVERY_ENABLED: process.env.FEATURE_PROACTIVE_DELIVERY !== 'false',
  ENHANCED_COLLECTIONS_ENABLED: process.env.FEATURE_ENHANCED_COLLECTIONS !== 'false',
  ADVANCED_NOTIFICATIONS_ENABLED: process.env.FEATURE_ADVANCED_NOTIFICATIONS !== 'false',
};

// ==========================================
// TITLE GOVERNOR (server/utils/title-governor.ts)
// ==========================================

export const makeTitle = (raw) => {
  const clean = raw.trim().replace(/\s+/g, ' ');
  return clean.length > 55 ? clean.slice(0, 52) + '…' : (clean || 'Untitled');
};