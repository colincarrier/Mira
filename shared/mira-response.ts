// ---------- shared/mira-response.ts ------------
export interface MiraTask {
  id?: string;            // filled server-side
  title: string;
  priority?: 'low' | 'normal' | 'high';
  completed?: boolean;
}

export interface EnrichedLink {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
}

export interface MiraResponseMeta {
  model: string;
  confidence: number;
  processingTimeMs: number;
  intentType: 'research' | 'reminder' | 'shopping' | 'general';
  v: 3;
}

export interface MiraResponse {
  /* Living-document markdown – unlimited length */
  content: string;

  /* Structured data, optional */
  tasks?: MiraTask[];
  reminders?: { timeISO: string; leadMins?: number }[];
  entities?: { value: string; type?: string; confidence?: number }[];
  links?: EnrichedLink[];
  media?: { url: string; type: 'image'|'video' }[];

  /* Metadata */
  meta: MiraResponseMeta;

  /* Thread for future recursion */
  thread?: { role:'user'|'mira'; content:string; ts:number }[];
}

// Legacy exports for compatibility
export type IntentType = MiraResponseMeta['intent'];
export type ProcessingPath = 'clarify' | 'evolve';

export const TOKEN_BUDGETS = {
  clarify: 3000,
  evolve: 6000,
  shopping: 8000,
  research: 8000
} as const;

// Zod schema for validation
import { z } from 'zod';

export const MiraResponseSchema = z.object({
  content: z.string(),
  tasks: z.array(z.object({
    id: z.string().optional(),
    title: z.string(),
    priority: z.enum(['low', 'normal', 'high']).optional(),
    completed: z.boolean().optional()
  })).optional(),
  reminders: z.array(z.object({
    timeISO: z.string(),
    leadMins: z.number().optional()
  })).optional(),
  entities: z.array(z.object({
    value: z.string(),
    type: z.string().optional(),
    confidence: z.number().optional()
  })).optional(),
  links: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    favicon: z.string().optional(),
    domain: z.string().optional()
  })).optional(),
  media: z.array(z.object({
    url: z.string(),
    type: z.enum(['image', 'video'])
  })).optional(),
  meta: z.object({
    model: z.string(),
    confidence: z.number(),
    processingTimeMs: z.number(),
    intent: z.enum(['research', 'reminder', 'shopping', 'general']),
    v: z.literal(3)
  }),
  thread: z.array(z.object({
    role: z.enum(['user', 'mira']),
    content: z.string(),
    ts: z.number()
  })).optional()
});