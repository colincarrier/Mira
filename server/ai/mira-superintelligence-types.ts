/**
 * STEP‑1 TYPES & CONSTANTS  –  ***AUTO‑GENERATED***
 * --------------------------------------------------
 * ▸ All foundational TypeScript interfaces for V3.
 * ▸ No behaviour / side‑effects here – pure contracts + helpers.
 * ▸ JSDoc included so IDEs give excellent hover help.
 */

/* eslint-disable @typescript-eslint/consistent-type-definitions */

/* -----------------------------------------------------------------
   GLOBAL CONSTANTS (foundation level – no secrets here)
   ----------------------------------------------------------------- */

/** Hard safety limit – never request more tokens than this from OpenAI. */
export const MAX_MODEL_TOKENS = Number(process.env.MIRA_AI_MAX_TOKENS ?? 8192);

/** Default sampling temperature (can be overridden per‑call). */
export const DEFAULT_TEMPERATURE = Number(process.env.MIRA_AI_TEMPERATURE ?? 0.35);

/** Weekly spend ceiling per user – *soft* cap (USD). */
export const WEEKLY_SPEND_CEIL = Number(process.env.AI_SPEND_USER_WEEKLY_CEIL_USD ?? 50);

/** Feature‑flag: is Step‑1 code active? */
export const STEP_1_FEATURE_FLAG = process.env.V3_STEP_1_ENABLED === 'true';

/* -----------------------------------------------------------------
   SHARED VALUE OBJECTS
   ----------------------------------------------------------------- */

/**
 * Rich description of the user's environment, relationships, and patterns.
 * This evolves over time (learning layer) but is immutable in a single
 * `processInput` call.
 */
export interface ProfileSnapshot {
  /** UUID of the user (internal DB id). */
  userId: string;
  /** 1‑paragraph auto‑summary of the user's bio. */
  bioSummary: string;
  /** Last ~10 user messages (compressed). */
  recentHistory: string[];
  /** Preference bundle (AI learns / user can override). */
  preferences: UserPreferences;
  /** Relationship graph keyed by name (lower‑cased). */
  relationshipContext: RelationshipMap;
  /** Observed patterns for personalisation heuristics. */
  todoAcceptanceRate: number;   // 0‑1
  reminderResponseRate: number; // 0‑1
}

/** Strongly‑typed user preferences. */
export type UserPreferences = {
  reminderLeadTimeMultiplier: number;          // e.g. 0.8 = sooner, 1.3 = later
  communicationStyle: 'formal' | 'casual' | 'technical';
  todoCreationThreshold: number;               // min explicitness score to auto‑create todo
  linkEnrichmentPreference: 'minimal' | 'standard' | 'comprehensive';
};

/** Map of known relationships and their meta. */
export type RelationshipMap = Record<
  string,
  {
    type: 'family' | 'friend' | 'colleague' | 'client' | 'vendor' | 'other';
    communicationStyle: 'formal' | 'casual';
    importance: 'low' | 'medium' | 'high' | 'critical';
    lastInteraction?: string; // ISO date
  }
>;

/* -----------------------------------------------------------------
   INPUT / DOCUMENT TYPES
   ----------------------------------------------------------------- */

export interface UserInput {
  content: string;
  mode: 'text' | 'voice' | 'image' | 'file';
  userId: string;
  contextualData?: {
    attachments?: string[];
    selectedText?: string;
    cursorPosition?: number;
  };
}

export interface LivingDocState {
  content: string;
  documentId: string;
  cursorPosition?: number;
  selectedText?: string;
  lastModified: string;
}

/* -----------------------------------------------------------------
   CONTEXT & ANALYSIS TYPES
   ----------------------------------------------------------------- */

export interface TimeContext {
  hasTimeReference: boolean;
  extractedTimes: Date[];
  urgencyLevel: 'immediate' | 'today' | 'this-week' | 'this-month' | 'future';
  culturalReferences: string[];
}

/** Result of ContextEngine.analyse() */
export interface ContextData {
  stakes: 'low' | 'medium' | 'high' | 'critical';
  domain:
    | 'personal'
    | 'business'
    | 'travel'
    | 'shopping'
    | 'health'
    | 'education';
  relationshipType?: string;
  timeContext?: TimeContext;
  knownEntities: string[];
  noveltyScore: number;              // 0‑1  (higher = more novel)
  prepOpportunity:
    | 'research'
    | 'logistics'
    | 'connections'
    | 'summary-only';
  userId: string;
  explicitLinkRequest: boolean;
}

/* -----------------------------------------------------------------
   OUTPUT PAYLOAD
   ----------------------------------------------------------------- */

export interface EnrichedLink {
  url: string;
  title: string;
  description: string;
  type: 'search' | 'product' | 'booking' | 'reference' | 'tool';
  relevanceScore: number;
}

export interface ExtractedTodo {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Date;
  estimatedTime?: string;
  tags: string[];
  explicitness: number; // 0‑1
}

export interface ExtractedReminder {
  title: string;
  dueDate: Date;
  leadTime: number; // minutes
  importance: 'low' | 'medium' | 'high' | 'critical';
  recurring?: boolean;
  relationshipType?: string;
}

export interface CollectionSuggestion {
  name: string;
  icon: string;
  color: string;
  confidence: number;
}

export interface VectorData {
  embedding: number[];
  metadata: Record<string, any>;
}

export interface DocUpdate {
  content: string;
  meta: {
    todos: ExtractedTodo[];
    reminders: ExtractedReminder[];
    collections: CollectionSuggestion[];
    vectors: VectorData[];
    links: EnrichedLink[];
    processingTime: number;  // ms
    costEstimate: number;    // USD
    reasoning: string;       // model explanation (compressed)
  };
}

/* -----------------------------------------------------------------
   PRE‑FLIGHT VALIDATION HELPERS
   ----------------------------------------------------------------- */

/** Thrown when required env variables are not set. */
export class MissingEnvError extends Error {
  constructor(key: string) {
    super(`[V3] Missing required env var: ${key}`);
  }
}

/** Validate env + file prerequisites for Step‑1 (cheap, sync). */
export function validateStep1Prerequisites(): void {
  const required = ['OPENAI_API_KEY', 'MIRA_V3_ENABLED'];
  required.forEach((key) => {
    if (!process.env[key]) throw new MissingEnvError(key);
  });
}

