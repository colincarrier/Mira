// Stage‑2C · OpenAI client with circuit‑breaker

import OpenAI from 'openai';
import pLimit from 'p-limit';
import {
  CircuitBreakerError,
  LLMResponse,
  ReasoningConfig,
  CircuitBreakerState,
  ReasoningError
} from './types.js';

export class OpenAIClient {
  private cli: OpenAI | null = null;
  private lim: ReturnType<typeof pLimit>;
  private cb: CircuitBreakerState = { state: 'closed', failureCount: 0 };

  private readonly THRESH = 5;               // failures -> open
  private readonly OPEN_MS = 60_000;         // open window

  constructor(private cfg: Required<ReasoningConfig>) {
    this.lim = pLimit(this.cfg.maxConcurrency);
    if (this.cfg.openaiApiKey) {
      this.cli = new OpenAI({
        apiKey: this.cfg.openaiApiKey,
        timeout: this.cfg.timeoutMs
      });
    } else {
      console.warn('[OpenAI] No API key – mock responses will be used');
    }
  }

  /* ---- helpers ---- */
  private now() { return Date.now(); }

  private recordFail() {
    this.cb.failureCount += 1;
    this.cb.lastFailureTime = new Date();
    if (this.cb.failureCount >= this.THRESH) {
      this.cb.state = 'open';
      this.cb.nextRetryTime = new Date(this.now() + this.OPEN_MS);
    }
  }

  private circuitClosed(): boolean {
    if (this.cb.state === 'closed') return true;
    if (
      this.cb.state === 'open' &&
      this.cb.nextRetryTime &&
      this.now() >= this.cb.nextRetryTime.getTime()
    ) {
      this.cb.state = 'half-open';
      return true;
    }
    return false;
  }

  /* ---- public ---- */
  async generate(prompt: string): Promise<LLMResponse> {
    if (!this.circuitClosed()) throw new CircuitBreakerError();

    return this.lim(async () => {
      /* ---------- mock path ---------- */
      if (!this.cli) {
        return {
          content: `(Mock) ${prompt.slice(0, 120)}`,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
        };
      }

      /* ---------- real call ---------- */
      try {
        const res = await Promise.race([
          this.cli.chat.completions.create({
            model: this.cfg.model,
            max_tokens: this.cfg.maxTokens,
            temperature: this.cfg.temperature,
            messages: [{ role: 'user', content: prompt }]
          }),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error('timeout')), this.cfg.timeoutMs)
          )
        ]);

        /* success in half‑open closes breaker */
        if (this.cb.state === 'half-open') {
          this.cb.state = 'closed';
          this.cb.failureCount = 0;
        }

        return {
          content: res.choices[0].message?.content ?? '(empty)',
          usage: {
            prompt_tokens: res.usage?.prompt_tokens ?? 0,
            completion_tokens: res.usage?.completion_tokens ?? 0,
            total_tokens: res.usage?.total_tokens ?? 0
          },
          finishReason: res.choices[0].finish_reason
        };
      } catch (err: any) {
        this.recordFail();
        throw new ReasoningError(err.message, 'OPENAI', true);
      }
    });
  }

  /* ---- monitoring / tests ---- */
  state() { return { ...this.cb }; }
  testTrip() {                          // deliberately open breaker (tests)
    this.cb.state = 'open';
    this.cb.failureCount = this.THRESH;
    this.cb.nextRetryTime = new Date(this.now() + this.OPEN_MS);
  }
  reset() { this.cb = { state: 'closed', failureCount: 0 }; }
}