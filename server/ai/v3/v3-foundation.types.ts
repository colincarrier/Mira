/**
 * V3 – FOUNDATION TYPE DEFINITIONS
 * These types are shared by every engine in V3.
 * No implementation logic should live in this file.
 * ────────────────────────────────────────────────
 * ✅ 100 % isolated from runtime so `tsc --noEmit` can sanity‑check quickly.
 */

/* ---------- 1.  Universal helpers ---------- */
export type ISODate = `${number}-${number}-${number}T${number}:${number}:${number}Z`;
export type TokenCount = number;
export type USDollars = number;
export type UUID = string;

/* ---------- 2.  Core user‑facing types ---------- */
export interface UserInput {
  userId: UUID;
  mode: 'text' | 'voice' | 'image' | 'file';
  content: string;
  contextualData?: {
    attachments?: string[];        // local URLs or data URIs
    selectedText?: string;
    cursorPosition?: number;
  };
}

export interface LivingDocState {
  documentId: UUID;
  content: string;                 // full markdown / html
  lastModified: ISODate;
  cursorPosition?: number;
}

export interface UserPreferences {
  reminderLeadTimeMultiplier: number;           // e.g. 1.2 ⇒ +20 %
  communicationStyle: 'formal' | 'casual' | 'technical';
  todoCreationThreshold: number;                // 0–1 implicit‑todo cutoff
  linkEnrichmentPreference: 'minimal' | 'standard' | 'comprehensive';
}

export interface RelationshipMeta {
  type: 'family' | 'friend' | 'colleague' | 'client' | 'vendor' | 'other';
  importance: 'low' | 'medium' | 'high' | 'critical';
  communicationStyle: 'formal' | 'casual';
  lastInteraction?: ISODate;
}

export interface ProfileSnapshot {
  userId: UUID;
  bioSummary: string;
  recentHistory: string[];                       // last 20 note IDs or text excerpts
  relationshipContext: Record<string, RelationshipMeta>;
  preferences: UserPreferences;

  /** Behavioural signals captured over time */
  todoAcceptanceRate: number;                    // 0–1
  reminderResponseRate: number;                  // 0–1
}

/* ---------- 3.  Context propagation ---------- */
export interface ContextData {
  userId: UUID;
  stakes: 'low' | 'medium' | 'high' | 'critical';
  domain: 'personal' | 'business' | 'travel' | 'shopping' | 'health' | 'education';
  relationshipType?: RelationshipMeta['type'];
  noveltyScore: number;                          // 0–1
  explicitLinkRequest: boolean;
}

export interface TimeContext {
  hasTimeReference: boolean;
  urgencyLevel: 'immediate' | 'today' | 'this-week' | 'this-month' | 'future';
  extractedTimes: ISODate[];
  culturalReferences: string[];
}

export interface V3ProcessingContext {
  stepName: string;
  startTime: number;
  costSoFar: USDollars;
  tokensUsed: TokenCount;
  decisions: string[];
  errors: string[];
}

/* ---------- 4.  Task / reminder / link output ---------- */
export interface ExtractedTodo {
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: ISODate;
  tags?: string[];
  explicitness: number;        // confidence 0–1
}

export interface ExtractedReminder {
  title: string;
  dueDate: ISODate;
  leadTimeMinutes: number;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface EnrichedLink {
  url: string;
  title: string;
  description: string;
  relevanceScore: number;      // 0–1
  type: 'search' | 'product' | 'booking' | 'reference' | 'tool';
}

export interface DocUpdateMeta {
  todos: ExtractedTodo[];
  reminders: ExtractedReminder[];
  links: EnrichedLink[];
  processingTimeMs: number;
  reasoning: string;
}

export interface DocUpdate {
  content: string;        // full merged doc
  meta: DocUpdateMeta;
}

/* ---------- 5.  Cost & budgeting ---------- */
export interface ValueMetrics {
  timeSavedMinutes?: number;
  decisionsAided?: number;
  todosCompleted?: number;
}

export interface ICostLedger {
  getWeekSpend(userId: UUID, isoWeek: string): Promise<USDollars>;
  addSpend(userId: UUID, isoWeek: string, amountUsd: USDollars): Promise<void>;
}

