export type EntityKind =
  | 'person' | 'pet' | 'place' | 'org' | 'project' | 'concept';

export interface Fact {
  id: string;
  user_id: string;
  entity_id: string;
  name: string;
  type: EntityKind;
  aliases: string[];
  contexts: string[];
  frequency: number;
  strength: number;
  last_mentioned: Date;
  created_at: Date;
  metadata: Record<string, unknown>;
}

export interface Event {
  id: string;
  user_id: string;
  timestamp: Date;
  type: string;
  action: string;
  summary?: string;
  entity_ids: string[];
  importance: number;
  metadata: Record<string, unknown>;
}

export interface Pattern {
  id: string;
  user_id: string;
  pattern_type: string;
  signature: string;
  pattern: unknown;
  confidence: number;
  observations: number;
  last_observed: Date;
  created_at: Date;
}

export type MemResult<T> = {
  success: true;  
  data: T;
} | {
  success: false; 
  error: string;
}
