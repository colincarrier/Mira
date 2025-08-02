/* Minimal superset of the shapes already emitted in worker.ts */

export interface Task {
  title: string;
  /** must match extract-tasks.ts and existing UI chips */
  priority?: 'low' | 'normal' | 'high';
  done?: boolean;
}

export interface EnrichedLink { 
  url: string; 
  title?: string; 
  description?: string; 
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  processingTimeMs: number;
  timestamp: string;
}

export interface MiraResponse {
  content: string;
  tasks: Task[];
  links: string[];
  reminders: any[];
  entities: any[];
  media: any[];
  enrichedLinks: EnrichedLink[];
  meta: {
    intent: string;
    confidence: number;
    v: 3;
    expertsActivated?: string[];
    recursionDepth?: number;
  } & TokenUsage;
  thread: any[];
}

export interface NoteEvent {
  type: 'enhancement_complete' | 'note_created' | 'note_updated';
  noteId?: number;
  content?: string;
  tasks?: Task[];
  tokenUsage?: TokenUsage;
  timestamp?: number;
  processingTime?: number;
  links?: string[];
  meta?: MiraResponse['meta'];
}