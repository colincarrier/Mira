/*************************************************************************************************
 *  MIRA V3 — STAGE‑1 FOUNDATION                                                                 *
 *  A single file containing all type declarations, config helpers, behavioural‑learning         *
 *  scaffolding, cost‑ledger plumbing, JSON‑safety utilities, validation hooks and the           *
 *  public entry‑points `initialiseV3()` + `prepareV3Context()`.                                 *
 *  THIS REPLACES any earlier step‑1 code.                                                       *
 ************************************************************************************************/

//#region Imports ──────────────────────────────────────────────────────────────────────────────
import type { ChatCompletionMessageParam } from 'openai/resources/chat/index.mjs';
import chrono from 'chrono-node';
import { JSDOM } from 'jsdom';
import dotenv from 'dotenv';
dotenv.config();
//#endregion

//#region Utility helpers  ─────────────────────────────────────────────────────────────────────
const num   = (v: string | undefined, def: string) => (v ? Number(v) : Number(def));
const bool  = (v: string | undefined, def = 'false') => (v ?? def).toLowerCase() === 'true';
const json  = <T>(v: string | undefined, def: T): T => { try { return v ? JSON.parse(v) : def; } catch { return def; } };
//#endregion

//#region 1.  Configuration object with *all* runtime tunables  ───────────────────────────────
export const V3Config = {
  TOKENS_MAX_REQUEST:        num(process.env.V3_TOKENS_MAX_REQUEST,   '8192'),
  TOKENS_MAX_RECURSION:      num(process.env.V3_TOKENS_MAX_RECURSE,   '2048'),
  TEMPERATURE:               Number(process.env.V3_TEMPERATURE ?? 0.35),

  /* Cost / budget */
  COST_SOFT_CAP_USD:         num(process.env.AI_SPEND_SOFT_CAP_USD,   '30'),
  COST_HARD_CAP_USD_WEEK:    num(process.env.AI_SPEND_USER_WEEKLY_CEIL_USD, '50'),

  /* Learning & anticipation parameters */
  LEARNING_RATE:             num(process.env.V3_LEARNING_RATE,        '0.01'),
  FEEDBACK_WINDOW_DAYS:      num(process.env.V3_FEEDBACK_WINDOW,      '30'),
  MIN_FEEDBACK_FOR_UPDATE:   num(process.env.V3_MIN_FEEDBACK,         '10'),
  DECISION_TREE_DEPTH:       num(process.env.V3_DECISION_TREE_DEPTH,  '5'),

  /* Feature flags */
  F_RECURSIVE:               bool(process.env.V3_RECURSIVE_REASONING, 'true'),
  F_LINKS:                   bool(process.env.V3_LINK_ENRICHMENT,     'true'),
  F_SMART_TASKS:             bool(process.env.V3_SMART_TASKS,         'true'),
  F_LIVING_DOC:              bool(process.env.V3_LIVING_DOCUMENT,     'true'),
  F_COST_TRACKING:           bool(process.env.V3_COST_TRACKING,       'true')
} as const;
//#endregion

//#region 2.  Core domain types  ───────────────────────────────────────────────────────────────
export interface UserInput {
  userId: string;
  content: string;
  mode: 'text' | 'voice' | 'image' | 'file';
  contextualData?: { attachments?: string[]; selectedText?: string; cursorPosition?: number; };
}

export interface TimeWindow { start: string; end: string; }
export interface Pattern      { description: string; strength: number; }
export interface Risk         { description: string; likelihood: number; impact: number; }
export interface Need         { description: string; horizon: 'immediate' | 'week' | 'month'; }
export interface RequestPrediction { likelyContent: string; probability: number; }
export interface ResponseTime { avgMinutes: number; stddev: number; }

export interface RelationshipMap {
  [person: string]: {
    type: 'family' | 'friend' | 'colleague' | 'client' | 'vendor' | 'other';
    communicationStyle: 'formal' | 'casual';
    importance: 'low' | 'medium' | 'high' | 'critical';
    dynamics: {
      responseTimeExpectation: number;
      preferredChannels: ('email' | 'text' | 'call')[];
      sentimentTrend: number;
    };
    contextualFactors: {
      timezone: string;
      culturalConsiderations: string[];
      currentProjects: string[];
    };
    predictions: { nextLikelyInteraction: Date; potentialConflicts: string[]; };
  };
}

export interface ProfileSnapshot {
  userId: string;
  bioSummary: string;
  recentHistory: string[];
  preferences: {
    reminderLeadTimeMultiplier: number;
    communicationStyle: 'formal' | 'casual' | 'technical';
    todoCreationThreshold: number;
    linkEnrichmentPreference: 'minimal' | 'standard' | 'comprehensive';
  };
  relationshipContext: RelationshipMap;
  todoAcceptanceRate: number;
  reminderResponseRate: number;

  /* Behavioural intelligence */
  behaviorPatterns: {
    peakProductivityWindows: TimeWindow[];
    decisionMakingStyle: 'analytical' | 'intuitive' | 'collaborative';
    stressIndicators: string[];
    successPatterns: Pattern[];
    communicationVelocity: Map<string, ResponseTime>;
  };
  predictions: { nextLikelyRequest: RequestPrediction[]; upcomingNeeds: Need[]; riskFactors: Risk[]; };
  learningState: { confidenceScores: Map<string, number>; lastModelUpdate: Date; };
}

export interface ContextData {
  stakes: 'low' | 'medium' | 'high' | 'critical';
  domain: 'personal' | 'business' | 'travel' | 'shopping' | 'health' | 'education';
  relationshipType?: string;
  timeContext: TimeContext;
  noveltyScore: number;
  prepOpportunity: 'research' | 'logistics' | 'connections' | 'summary-only';
  explicitLinkRequest: boolean;
}

export interface TimeContext {
  hasTimeReference: boolean;
  deadlines: Deadline[];
  optimalWindows: TimeWindow[];
  urgencyLevel: 'immediate' | 'today' | 'this-week' | 'this-month' | 'future';
}
export interface Deadline {
  description: string; absoluteTime: Date; flexibilityHours: number;
  missConsequence: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValueMetrics { todos: number; reminders: number; links: number; estimatedMinutesSaved: number; }

export interface BudgetDecision { approved: boolean; reason: string; maxCost: number; }

export interface V3ProcessingContext {
  stepName: string; startTime: number; tokensUsed: number; costSoFar: number;
  decisionTree?: DecisionNode; errors: Error[];
  memoized: { entities: string[]; };
}

export interface DecisionNode { action: string; probability: number; valueScore: number; children: DecisionNode[]; }

//#endregion

//#region 3.  Cost‑ledger & budget logic  ───────────────────────────────────────────────────────
/** Intelligent ledger capable of ROI prediction and dynamic budgets */
export interface IIntelligentCostLedger {
  recordTransaction(tx: {
    userId: string; cost: number; tokensIn: number; tokensOut: number;
    valueDelivered: ValueMetrics; context: ContextData; outcome: 'accepted' | 'rejected' | 'modified';
  }): Promise<void>;
  predictValueROI(userId: string, estCost: number, ctx: ContextData): Promise<number>;
  getDynamicBudget(userId: string, ctx: ContextData): Promise<BudgetDecision>;
}

/** In‑memory, non‑persistent default implementation (swap for Redis later) */
export class MemoryCostLedger implements IIntelligentCostLedger {
  private store = new Map<string, { spend: number; value: number; }>();

  async recordTransaction(tx: any) {
    const key = `${tx.userId}:${new Date().toISOString().slice(0,7)}`;
    const record = this.store.get(key) || { spend: 0, value: 0 };
    record.spend += tx.cost; record.value += (tx.valueDelivered?.estimatedMinutesSaved ?? 0);
    this.store.set(key, record);
  }
  async predictValueROI(_: string, est: number) { return 1 / est; }
  async getDynamicBudget(_: string): Promise<BudgetDecision> {
    return { approved: true, reason: 'dev‑mode', maxCost: V3Config.COST_HARD_CAP_USD_WEEK };
  }
}
//#endregion

//#region 4.  JSON‑safety & validation helpers  ────────────────────────────────────────────────
export class StreamingJsonValidator {
  static safeParse(str: string, fallback = {}) {
    try { return JSON.parse(str); } catch { return fallback; }
  }
}
//#endregion

//#region 5.  Pre‑flight validation  ───────────────────────────────────────────────────────────
export function validateStage1Prerequisites() {
  const envs = ['OPENAI_API_KEY'];
  envs.forEach(e => { if (!process.env[e]) throw new Error(`[V3] Missing env: ${e}`); });
  console.log('[V3] Stage‑1 prerequisites satisfied ✅');
}
//#endregion

//#region 6.  public bootstrap API  ────────────────────────────────────────────────────────────
export function initialiseV3() {
  validateStage1Prerequisites();
  console.log('[V3] Stage‑1 foundation loaded.  Config ⇣'); console.table(V3Config);
}

export function prepareV3Context(): V3ProcessingContext {
  return { stepName: 'stage‑1', startTime: Date.now(), tokensUsed: 0, costSoFar: 0, errors: [], memoized: { entities: [] } };
}
//#endregion

//#region 7.  Minimal Jest test harness  ───────────────────────────────────────────────────────
/* If Jest is configured, the following will auto‑discover */
if (process.env.NODE_ENV === 'test') {
  describe('Stage‑1 foundation', () => {
    it('validates env vars', () => { expect(() => validateStage1Prerequisites()).not.toThrow(); });
    it('creates baseline context', () => {
      const ctx = prepareV3Context(); expect(ctx.stepName).toBe('stage‑1');
    });
  });
}
//#endregion
