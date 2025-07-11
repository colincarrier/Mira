/*─────────────────────────────────────────────────────────────────────────────┐
│  MIRA V3 · FOUNDATION MODULE                                                │
│  -------------------------------------------------------------------------  │
│  · Single source of truth for:                                              │
│      – TypeScript interfaces & strong types                                 │
│      – Global configuration constants & ENV parsing                         │
│      – Cost‑management helpers                                              │
│      – Error‑boundary & metric scaffolding                                  │
│  · Pure–logic only (no network or model calls).                             │
└─────────────────────────────────────────────────────────────────────────────*/

/* ===========================================================================
   0.  NODE/ENV SAFETY
   ======================================================================== */
import assert from 'node:assert';

/* ===========================================================================
   1.  GLOBAL / USER CONFIGURATION
   ======================================================================== */
/** Pulls, validates and normalises every env var V3 cares about.
 *  Fail‑fast on launch if something critical is missing. */
export const V3Config = (() => {
  const bool = (v?: string, d = 'false') => (v ?? d).toLowerCase() === 'true';
  const num  = (v?: string, d = '0')     => Number.parseFloat(v ?? d);

  const cfg = {
    // Feature flags
    ENABLED              : bool(process.env.MIRA_V3_ENABLED,        'true'),
    RECURSIVE_REASONING  : bool(process.env.V3_RECURSIVE_REASONING, 'true'),
    LINK_ENRICHMENT      : bool(process.env.V3_LINK_ENRICHMENT,     'true'),
    SMART_TASKS          : bool(process.env.V3_SMART_TASKS,         'true'),
    LIVING_DOCUMENT      : bool(process.env.V3_LIVING_DOCUMENT,     'true'),
    COST_TRACKING        : bool(process.env.V3_COST_TRACKING,       'true'),

    // Model controls
    MODEL_NAME           : process.env.MIRA_AI_MODEL        || 'gpt-4o',
    MAX_TOKENS           : num(process.env.MIRA_AI_MAX_TOKENS,      '8192'),
    TEMPERATURE          : num(process.env.MIRA_AI_TEMPERATURE,     '0.35'),

    // Budgeting
    SOFT_CAP_WEEK_USD    : num(process.env.AI_SPEND_USER_SOFT_WEEKLY_USD, '30'),
    HARD_CAP_WEEK_USD    : num(process.env.AI_SPEND_USER_WEEKLY_CEIL_USD, '50'),
    TOKEN_COST_PROMPT    : num(process.env.AI_COST_PROMPT,  '0.000005'),
    TOKEN_COST_COMP      : num(process.env.AI_COST_COMP,    '0.000015'),

    // Observability & rollout
    CANARY_USER_IDS      : (process.env.V3_CANARY_USERS || '').split(',').filter(Boolean),
    ROLLOUT_PERCENT      : num(process.env.V3_PERCENT_ROLLOUT, '0'), // 0‑100
  } as const;

  // Hard fails
  assert.ok(process.env.OPENAI_API_KEY,  'OPENAI_API_KEY missing');
  assert.ok(cfg.SOFT_CAP_WEEK_USD < cfg.HARD_CAP_WEEK_USD,
            'SOFT cap must be below HARD cap');

  return cfg;
})();

/* ===========================================================================
   2.  FUNDAMENTAL TYPES
   ======================================================================== */
/** High‑level user input delivered to V3. */
export interface UserInput {
  /** Raw textual instruction or transcribed speech. */
  content : string;
  /** Origin modality (affects context derivation). */
  mode    : 'text' | 'voice' | 'image' | 'file';
  /** Authenticated user ID (used for profiling & cost). */
  userId  : string;
  /** Supplementary data from the UI layer. */
  contextualData?: {
    attachments?    : string[];   // URLs or storage keys
    selectedText?   : string;     // if user highlighted part of the doc
    cursorPosition? : number;     // caret offset inside editable field
  };
}

/** Current state of the living document (note detail). */
export interface LivingDocState {
  content       : string;          // Markdown/text currently shown to user
  documentId    : string;
  cursorPosition: number | null;
  lastModified  : string;          // ISO timestamp
}

/** Snapshot of what we know about the user right now. */
export interface ProfileSnapshot {
  userId               : string;
  bioSummary           : string;
  recentHistory        : string[];      // last N note titles
  preferences          : UserPreferences;
  relationshipContext  : RelationshipMap;
  todoAcceptanceRate   : number;        // 0‑1  (observed historical)
  reminderResponseRate : number;        // 0‑1
}

/** Individual user preferences discovered or set. */
export interface UserPreferences {
  reminderLeadTimeMultiplier : number; //  e.g. 1.5 = wants earlier pings
  communicationStyle         : 'formal' | 'casual' | 'technical';
  todoCreationThreshold      : number; //  0‑1 confidence required
  linkEnrichmentPreference   : 'minimal' | 'standard' | 'comprehensive';
}

/** Map of people → relationship meta (used for tone & stakes). */
export interface RelationshipMap {
  [personName: string]: {
    type               : 'family' | 'friend' | 'colleague' | 'client' | 'vendor' | 'other';
    communicationStyle : 'formal' | 'casual';
    importance         : 'low' | 'medium' | 'high' | 'critical';
    lastInteraction?   : string;  // ISO timestamp
  };
}

/** End‑to‑end output returned to the UI after AI + weaving. */
export interface DocUpdate {
  content : string;   // merged document markdown
  meta    : DocMeta;
}

/** All non‑document data produced during processing. */
export interface DocMeta {
  todos         : ExtractedTodo[];
  reminders     : ExtractedReminder[];
  collections   : CollectionSuggestion[];
  vectors       : VectorData[];
  links         : EnrichedLink[];
  processingTime: number;    // ms
  costEstimate  : number;    // US$
  reasoning     : string;    // dev‑mode trace
}

/* ---------- granular value objects ---------- */
export interface ExtractedTodo {
  title        : string;
  description? : string;
  priority     : 'low' | 'medium' | 'high' | 'critical';
  dueDate?     : Date;
  estimatedTime?: string; // "30‑45 min"
  tags         : string[];
  explicitness : number;  // confidence 0‑1
}

export interface ExtractedReminder {
  title        : string;
  dueDate      : Date;
  leadTime     : number;  // minutes before due
  importance   : 'low' | 'medium' | 'high' | 'critical';
  recurring?   : boolean;
  relationshipType?: string;
}

export interface EnrichedLink {
  url           : string;
  title         : string;
  description   : string;
  type          : 'search' | 'product' | 'booking' | 'reference' | 'tool';
  relevanceScore: number; // 0‑1
}

export interface CollectionSuggestion {
  name      : string;
  icon      : string;
  color     : string;
  confidence: number; // 0‑1
}

export interface VectorData {
  embedding: number[];
  metadata : Record<string, any>;
}

/** Rich processing context object passed between engines. */
export interface V3ProcessingContext {
  stepName   : string;
  startTime  : number;
  costSoFar  : number;
  tokensUsed : number;
  decisions  : DecisionRecord[];
  errors     : ErrorRecord[];
}

export interface DecisionRecord {
  timestamp : number;
  step      : string;
  rationale : string;
}

export interface ErrorRecord {
  timestamp : number;
  step      : string;
  message   : string;
  stack?    : string;
}

/* ===========================================================================
   3.  COST‑MANAGEMENT PRIMITIVES
   ======================================================================== */
/** Very thin interface so we can swap in‑memory ↔ Redis ↔ (future) Stripe. */
export interface ICostLedger {
  /** Retrieve total $ spend for a user since given ISO week start. */
  getWeekSpend(userId: string, isoWeek: string): Promise<number>;
  /** Increment spend and persist. */
  addSpend(userId: string, isoWeek: string, amountUsd: number): Promise<void>;
}

/** Default in‑memory fallback (non‑persistent, dev‑only). */
export class InMemoryCostLedger implements ICostLedger {
  private spend = new Map<string, number>(); // key = userId|week
  async getWeekSpend(u: string, w: string) {
    return this.spend.get(`${u}|${w}`) ?? 0;
  }
  async addSpend(u: string, w: string, amt: number) {
    const k = `${u}|${w}`;
    this.spend.set(k, (this.spend.get(k) || 0) + amt);
  }
}

/* ===========================================================================
   4.  ERROR BOUNDARY WRAPPER
   ======================================================================== */
export class V3ErrorBoundary {
  /** Executes `operation`; on error logs + returns `fallback`. */
  static async wrap<T>(
    stepName : string,
    operation: () => Promise<T>,
    fallback : T,
    ctx?     : V3ProcessingContext
  ): Promise<T> {
    try {
      const result = await operation();
      return result;
    } catch (err: any) {
      console.error(`[V3.${stepName}] ❌ ${err.message}`);
      if (ctx) {
        ctx.errors.push({
          timestamp: Date.now(),
          step     : stepName,
          message  : err.message,
          stack    : err.stack
        });
      }
      return fallback;
    }
  }
}

/* ===========================================================================
   5.  METRIC / OBSERVABILITY STUBS
   ======================================================================== */
type MetricFn = (name: string, value?: number) => void;

/** Pluggable hooks – wire these to your monitoring system (Datadog, etc.). */
export const metrics = {
  increment: (global as any).__MIRA_METRIC_INC as MetricFn ?? ((n) => console.debug(`(+1) ${n}`)),
  gauge    : (global as any).__MIRA_METRIC_GAUGE as MetricFn ?? ((n,v)=>console.debug(`[G] ${n}=${v}`)),
  timing   : (global as any).__MIRA_METRIC_TIME  as MetricFn ?? ((n,v)=>console.debug(`[T] ${n}=${v}ms`))
};

/* ===========================================================================
   6.  UTILITY – ISO week key helper
   ======================================================================== */
export function isoWeek(date = new Date()): string {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Thursday in week = week year
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
  const weekNo =  Math.ceil((((tmp as any) - (yearStart as any)) / 86400000 + 1)/7);
  return `${tmp.getUTCFullYear()}‑W${weekNo.toString().padStart(2,'0')}`;
}
