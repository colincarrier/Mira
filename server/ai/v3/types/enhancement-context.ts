// Narrow context that really matches the current DB schema.

export interface MemoryFact {
  id: string;
  name: string;
  type: string;                    // column "type"
  extraction_confidence: number;   // column "extraction_confidence"
  last_accessed: Date | null;
}

export interface EnhancementContext {
  noteId: string;
  userId: string | null;
  content: string;
  memoryFacts: MemoryFact[];
  reasoningResult?: {
    answer: string;
    tasks: {
      task: string;
      timing_hint?: string;
      confidence: number;
    }[];
    meta: {
      confidence: number;
      model: string;
      latencyMs: number;
      cached?: boolean;
    };
  };
}

export interface EnhancementProgress {
  type: 'progress' | 'complete' | 'error';
  stage: 'memory' | 'reasoning' | 'validation' | 'complete';
  message: string;
  timestamp: string;
  data?: unknown;
}