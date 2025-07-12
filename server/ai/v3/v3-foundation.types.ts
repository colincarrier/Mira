/**
 *  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 *  ┃  MIRA SUPER‑INTELLIGENCE  •  V3  •  FOUNDATION TYPE LAYER     ┃
 *  ┃  -----------------------------------------------------------  ┃
 *  ┃  All *static* definitions – no runtime side‑effects.          ┃
 *  ┃  Import this module from every engine / util in V3.           ┃
 *  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
 */

import type { Dayjs } from 'dayjs';  // just for type annotation (peer dep)

/*───────────────────────────────────────────────────────────────────────────│
 │  0.  SMALL HELPERS                                                       │
 └──────────────────────────────────────────────────────────────────────────*/

export const num = (raw: string | undefined, fallback: string): number =>
  isFinite(Number(raw)) ? Number(raw) : Number(fallback);

/** ISO‑week string `"2025‑W09"` – used as cost / usage partition key */
export const isoWeek = (d = new Date()): string => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday in current week decides the year.
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 864e5 + 1) / 7);
  return `${date.getUTCFullYear()}‑W${String(weekNo).padStart(2, '0')}`;
};

/*───────────────────────────────────────────────────────────────────────────│
 │  1.  VALUE & COST INTELLIGENCE                                          │
 └──────────────────────────────────────────────────────────────────────────*/

/** Objective signals we can capture to estimate user‑perceived value. */
export interface ValueMetrics {
  todosCreated: number;
  remindersCreated: number;
  timeSavedMinutes: number;         // AI actions that prevented manual work
  decisionsAided: number;           // e.g. "Which laptop?" – AI suggested answer
  linksFollowed: number;
  contentLengthDelta: number;       // tokens added to doc
  subjectiveRating?: number;        // future explicit 👍/👎
}

export interface BudgetDecision {
  approved: boolean;
  maxUsd: number;
  reason: string;
}

/* Intelligent cost ledger – enables ROI‑aware throttling */
export interface IIntelligentCostLedger {
  recordTransaction(tx: {
    userId: string;
    isoWeek: string;
    costUsd: number;
    tokensIn: number;
    tokensOut: number;
    value: ValueMetrics;
    context: V3ProcessingContextSnap;
    outcome: 'accepted' | 'rejected' | 'modified' | 'ignored';
  }): Promise<void>;

  /** Predict ROI score ∈ [0,1] – >0.7 strongly recommended to run  */
  predictValueROI(
    userId: string,
    estCostUsd: number,
    context: V3ProcessingContextSnap
  ): Promise<number>;

  /** Dynamically adjust per‑user soft‑budget based on historic ROI. */
  getDynamicBudgetUsd(
    userId: string,
    context: V3ProcessingContextSnap
  ): Promise<number>;
}

/*───────────────────────────────────────────────────────────────────────────│
 │  2.  USER & RELATIONSHIP INTELLIGENCE                                   │
 └──────────────────────────────────────────────────────────────────────────*/

export interface TimeWindow {
  startMinutes: number; // 0‑1439
  endMinutes: number;   // inclusive
}

export interface Pattern {
  description: string;
  confidence: number;          // 0‑1
  supportingExamples: number;
}

export interface ResponseTime {
  averageMinutes: number;
  lastObservedMinutes: number;
}

export interface RequestPrediction {
  probableContent: string;
  probability: number;
  horizonMinutes: number;
}

export interface Need {
  description: string;
  probability: number;
  horizonMinutes: number;
  expectedValue: number;       // estimated minutes saved if Mira handles
}

export interface Risk {
  description: string;
  probability: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface Feedback {
  timestamp: Date;
  signal: 'positive' | 'negative' | 'neutral';
  comment?: string;
  relatedActionId?: string;
}

/* Rich, evolving relationship intelligence */
export interface RelationshipProfile {
  type: 'family' | 'friend' | 'colleague' | 'client' | 'vendor' | 'investor' | 'other';
  communicationStyle: 'formal' | 'casual' | 'technical';
  importance: 'low' | 'medium' | 'high' | 'critical';

  dynamics: {
    responseTimeExpectation: number;
    preferredChannels: ('email' | 'text' | 'call' | 'meeting')[];
    topicsOfMutualInterest: string[];
    communicationFrequency: number;
    sentimentTrend: number; // ‑1 ⇢ 1
  };

  contextualFactors: {
    timezone: string;
    workingHours: TimeWindow;
    culturalConsiderations: string[];
    currentProjects: string[];
  };

  predictions: {
    nextLikelyInteraction: Date | null;
    upcomingNeeds: string[];
    potentialConflicts: string[];
  };
}

export interface RelationshipMap {
  [personName: string]: RelationshipProfile;
}

/* Full behavioural snapshot (serialisable to db) */
export interface ProfileSnapshot {
  userId: string;
  bioSummary: string;
  recentHistory: string[];

  /** Static preferences the user sets explicitly */
  preferences: {
    reminderLeadTimeMultiplier: number;
    communicationStyle: 'formal' | 'casual' | 'technical';
    todoCreationThreshold: number;     // 0‑1
    linkEnrichmentPreference: 'minimal' | 'standard' | 'comprehensive';
  };

  /** Dynamic patterns & predictive models learned over time */
  behaviorPatterns: {
    peakProductivityWindows: TimeWindow[];
    decisionMakingStyle: 'analytical' | 'intuitive' | 'collaborative';
    stressIndicators: string[];
    successPatterns: Pattern[];
    communicationVelocity: Map<string /*person*/, ResponseTime>;
  };

  predictions: {
    nextLikelyRequest: RequestPrediction[];
    upcomingNeeds: Need[];
    riskFactors: Risk[];
  };

  learningState: {
    confidenceScores: Map<string /*model*/, number>;
    lastModelUpdate: Date | null;
    feedbackHistory: Feedback[];
  };

  relationshipContext: RelationshipMap;

  // High‑level success metrics
  todoAcceptanceRate: number;    // ratio accepted / suggested
  reminderResponseRate: number;  // ratio acted / reminders
}

/*───────────────────────────────────────────────────────────────────────────│
 │  3.  TIME & DEADLINE INTELLIGENCE                                       │
 └──────────────────────────────────────────────────────────────────────────*/

export interface TimeDependency {
  from: string;   // id of prerequisite task
  to: string;     // id of dependent task
  type: 'hard' | 'soft';
}

export interface CulturalEvent {
  name: string;
  date: Date;
  region: string;
}

export interface TimeFrame {
  start: Date;
  end: Date;
  label?: string;
}

export interface Deadline {
  description: string;
  absoluteTime: Date;
  flexibilityHours: number;
  downstreamImpact: string[];
  missConsequence: 'low' | 'medium' | 'high' | 'critical';
}

/** Deep, holistic time context recognised in a single user utterance */
export interface RichTimeContext {
  hasTimeReference: boolean;
  extractedTimes: Date[];
  deadlines: Deadline[];
  dependencies: TimeDependency[];
  optimalWindows: TimeWindow[];
  culturalEvents: CulturalEvent[];
  personalRhythms: {
    productivityPeaks: TimeWindow[];
    communicationPrefs: Map<string /*channel*/, TimeWindow>;
  };
  urgencyLevel:
    | 'immediate'
    | 'today'
    | 'this-week'
    | 'this-month'
    | 'future';
}

/*───────────────────────────────────────────────────────────────────────────│
 │  4.  ANTICIPATORY & REASONING STRUCTURES                                 │
 └──────────────────────────────────────────────────────────────────────────*/

export interface Requirement {
  description: string;
  mandatory: boolean;
  source?: string;
}

export interface Solution {
  type: 'template' | 'automation' | 'information' | 'connection';
  content: string;
  implementationHint: string;
  confidenceScore: number;
}

export interface DecisionNode {
  action: string;
  probability: number;               // expected user interest
  requirements: Requirement[];
  risks: Risk[];
  timeEstimateMinutes: number;
  children: DecisionNode[];
  valueScore: number;                // expected minutes saved
}

export interface FrictionPoint {
  path: string[];                    // breadcrumb in decision tree
  type:
    | 'information_gap'
    | 'decision_required'
    | 'resource_needed'
    | 'coordination_required';
  severity: 'low' | 'medium' | 'high' | 'blocker';
  solution: Solution;
  preventionCostMinutes: number;
}

export interface ParallelPath {
  description: string;
  estimatedValueScore: number;
  confidence: number;
}

export interface ExtractedEntity {
  text: string;
  type:
    | 'person'
    | 'organisation'
    | 'location'
    | 'product'
    | 'event'
    | 'concept'
    | 'other';
  salience: number;
}

/*───────────────────────────────────────────────────────────────────────────│
 │  5.  PROCESSING CONTEXT (flows across engines)                           │
 └──────────────────────────────────────────────────────────────────────────*/

export interface V3ProcessingContextSnap {
  stepName: string;
  startIso: string;                // ISO timestamp
  costUsdSoFar: number;
  tokensUsed: number;
  decisions: DecisionNode[];
  frictionPoints: FrictionPoint[];
  parallelPaths: ParallelPath[];
  confidenceModifiers: Map<string, number>;
  memoized: {
    entities: ExtractedEntity[];
    timeframes: TimeFrame[];
    dependencies: TimeDependency[];
  };
}

/** Mutable context object passed by reference across engines */
export interface V3ProcessingContext extends V3ProcessingContextSnap {
  /** Append helper (mutative) */
  addDecision(node: DecisionNode): void;
  addFriction(fp: FrictionPoint): void;
  incCost(usd: number): void;
  incTokens(count: number): void;
}

/*───────────────────────────────────────────────────────────────────────────│
 │  6.  CONFIGURATION (all env‑driven)                                      │
 └──────────────────────────────────────────────────────────────────────────*/

export const V3Config = {
  /* Feature gates */
  ENABLED: process.env.MIRA_V3_ENABLED === 'true',
  STEP_1_ENABLED: process.env.V3_STEP_1_ENABLED !== 'false',

  /* Cost & budget */
  SOFT_MONTHLY_CAP_USD: num(process.env.AI_SOFT_MONTHLY_USD, '30'),
  HARD_WEEKLY_CAP_USD: num(process.env.AI_HARD_WEEKLY_USD, '50'),
  TOKEN_PRICE_IN: num(process.env.AI_PRICE_IN, '0.000005'),
  TOKEN_PRICE_OUT: num(process.env.AI_PRICE_OUT, '0.000015'),

  /* Model choices */
  MODEL_PRIMARY: process.env.MIRA_MODEL_PRIMARY || 'gpt-4o',
  MODEL_FALLBACKS: (process.env.MIRA_MODEL_FALLBACKS || 'gpt-4-turbo,gpt-3.5-turbo').split(','),

  /* Token limits */
  MAX_TOKENS_REQUEST: num(process.env.MIRA_MAX_TOKENS, '8192'),
  MAX_TOKENS_RECURSE: num(process.env.MIRA_MAX_RECURSE_TOKENS, '2048'),

  /* Intelligence thresholds */
  VALUE_THRESHOLD: num(process.env.V3_VALUE_THRESHOLD, '0.25'),
  DECISION_TREE_MAX_DEPTH: num(process.env.V3_DECISION_TREE_DEPTH, '5'),
  FRICTION_POINT_MIN_SEVERITY: process.env.V3_FRICTION_MIN_SEVERITY || 'medium',
  PARALLEL_PATH_MIN_VALUE: num(process.env.V3_PARALLEL_MIN_VALUE, '0.3'),

  /* Learning parameters */
  LEARNING_RATE: num(process.env.V3_LEARNING_RATE, '0.01'),
  FEEDBACK_WINDOW_DAYS: num(process.env.V3_FEEDBACK_WINDOW, '30'),
  MIN_FEEDBACK_FOR_UPDATE: num(process.env.V3_MIN_FEEDBACK, '10'),

  /* Anticipation horizons (minutes) */
  ANTICIPATION_HORIZONS: {
    immediate: num(process.env.V3_HORIZON_IMMEDIATE, '60'),
    short: num(process.env.V3_HORIZON_SHORT, '1440'),
    medium: num(process.env.V3_HORIZON_MEDIUM, '10080')
  },

  /* Canary rollout */
  CANARY_USER_IDS: (process.env.V3_CANARY_USERS || '').split(',').filter(Boolean)
} as const;

/*───────────────────────────────────────────────────────────────────────────│
 │  7.  FEATURE‑FLAG HELPERS                                                │
 └──────────────────────────────────────────────────────────────────────────*/

export const FeatureFlags = {
  v3EnabledForUser(userId: string): boolean {
    if (!V3Config.ENABLED) return false;
    if (V3Config.CANARY_USER_IDS.includes(userId)) return true;
    // 10 % random rollout otherwise
    return Math.random() < 0.10;
  }
};

/*───────────────────────────────────────────────────────────────────────────│
 │  8.  RUNTIME GUARDS  (lightweight)                                       │
 └──────────────────────────────────────────────────────────────────────────*/

export const preflightValidateFoundation = (): void => {
  const required = ['OPENAI_API_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`[V3‑Foundation] Missing env vars: ${missing.join(', ')}`);
  }
  // warn if monthly cap unset
  if (!process.env.AI_SOFT_MONTHLY_USD) {
    console.warn('[V3‑Foundation] AI_SOFT_MONTHLY_USD not set – using default $30');
  }
};

/*─────────────────────────────  END OF FILE  ──────────────────────────────*/
