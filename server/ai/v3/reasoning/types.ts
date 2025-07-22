// Stage‑2C · shared types ----------------------------------------------------

export interface ReasoningConfig {
  openaiApiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  cacheSize?: number;
  cacheTtlMs?: number;
  maxConcurrency?: number;
}

/* OpenAI v5 usage object */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface LLMResponse {
  content: string;
  usage?: TokenUsage;
  finishReason?: string;
}

/* Circuit‑breaker state */
export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
}

export interface ReasoningRequest {
  userId: string;
  noteText: string;
  options?: {
    skipCache?: boolean;
    includeContext?: boolean;
  };
}

export interface ExtractedTask {
  type: string;
  title: string;
  priority?: string;
  confidence: number;
  [k: string]: unknown;
}

export interface ReasoningResponse {
  answer: string;
  task?: ExtractedTask;
  meta: {
    cached: boolean;
    latencyMs: number;
    tokenUsage?: TokenUsage;
    confidence: number;
    model: string;
  };
}

/* Error hierarchy */
export class ReasoningError extends Error {
  constructor(msg: string, public code: string, public retryable = false) {
    super(msg);
  }
}
export class ValidationError extends ReasoningError {
  constructor(msg: string) {
    super(msg, 'VALIDATION', false);
  }
}
export class CircuitBreakerError extends ReasoningError {
  constructor() {
    super('Circuit breaker open', 'CB_OPEN', true);
  }
}