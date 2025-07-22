// Stage‑2C · main engine -----------------------------------------------------

import { LRUCache } from 'lru-cache';
import { createHash } from 'crypto';
import { OpenAIClient } from './openai-client.js';
import { PromptBuilder } from './prompt-builder.js';
import { ContextMemory } from '../context/context-memory.js';
import { Memory } from '../memory/simple-memory.js';
import { contextPool } from '../context/db-pool.js';
import {
  ReasoningConfig,
  ReasoningRequest,
  ReasoningResponse,
  ExtractedTask,
  CircuitBreakerError
} from './types.js';

export class ReasoningEngine {
  private pb = new PromptBuilder();
  private ctxMem = new ContextMemory();
  private cfg: Required<ReasoningConfig>;
  private cache: LRUCache<string, ReasoningResponse>;
  private ai: OpenAIClient;
  private stats = { req: 0, hit: 0, err: 0, ms: 0 };

  constructor(c: ReasoningConfig = {}) {
    this.cfg = {
      openaiApiKey: c.openaiApiKey || process.env.OPENAI_API_KEY || '',
      model: c.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      maxTokens: c.maxTokens ?? 300,
      temperature: c.temperature ?? 0.2,
      timeoutMs: c.timeoutMs ?? 15_000,
      cacheSize: c.cacheSize ?? 2000,
      cacheTtlMs: c.cacheTtlMs ?? 600_000,
      maxConcurrency: c.maxConcurrency ?? 3
    };
    this.cache = new LRUCache({ max: this.cfg.cacheSize, ttl: this.cfg.cacheTtlMs });
    this.ai = new OpenAIClient(this.cfg);
  }

  /* short SHA‑256 (16 hex) */
  private noteHash(txt: string) {
    return createHash('sha256').update(txt.trim()).digest('hex').slice(0, 16);
  }
  private key(u: string, n: string, o: unknown) {
    return `${u}:${this.noteHash(n)}:${this.noteHash(JSON.stringify(o || {}))}`;
  }

  /* ---------- public entry‑point ---------- */
  async processNote(
    uid: string,
    note: string,
    opt: ReasoningRequest['options'] = {}
  ): Promise<ReasoningResponse> {
    const t0 = Date.now();
    this.stats.req++;

    /* ----- cache lookup ----- */
    const k = this.key(uid, note, opt);
    if (!opt.skipCache) {
      const hit = this.cache.get(k);
      if (hit) {
        this.stats.hit++;
        return hit;
      }
    }

    /* ----- Stage‑2A context facts ----- */
    let facts: string[] = [];
    if (opt.includeContext !== false) {
      try {
        const result = await Memory.recallFacts(uid, note, 5);
        if (result && result.success) {
          facts = result.data.map((f: any) => f.name);
        }
      } catch (err) {
        console.warn('[Reasoning] Facts recall failed:', (err as Error).message);
      }
    }

    /* ----- Stage‑2B entity extraction ----- */
    let ents: string[] = [];
    if (opt.includeContext !== false) {
      try {
        const ext = await this.ctxMem.processNote(uid, note);
        ents = ext.extraction.entities.map((e) => e.text);
      } catch (err) {
        console.warn('[Reasoning] Entity extraction failed:', (err as Error).message);
      }
    }

    /* ----- build prompt & call LLM ----- */
    const prompt = this.pb.build(uid, note, [...facts, ...ents]);
    let llm;
    try {
      llm = await this.ai.generate(prompt);
    } catch (err) {
      this.stats.err++;
      if (err instanceof CircuitBreakerError) {
        return {
          answer: "I'm temporarily unavailable – please try again soon.",
          meta: {
            cached: false,
            latencyMs: Date.now() - t0,
            confidence: 0,
            model: this.cfg.model
          }
        };
      }
      throw err;
    }

    /* ----- assemble response ----- */
    const task = this.pb.extractTask(llm.content) as ExtractedTask | null;
    const resp: ReasoningResponse = {
      answer: this.pb.sanit(llm.content.replace(/TASK_JSON:.*/g, '')),
      task: task ?? undefined,
      meta: {
        cached: false,
        latencyMs: Date.now() - t0,
        tokenUsage: llm.usage,
        confidence: task?.confidence ?? 0.8,
        model: this.cfg.model
      }
    };

    this.cache.set(k, resp);

    /* ----- async DB log (fire‑and‑forget) ----- */
    const hash = this.noteHash(note);
    contextPool
      .query(
        `INSERT INTO memory.reasoning_logs
         (user_id,note_excerpt,note_hash,model,latency_ms,token_usage,answer,task_json,success,error_message)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          uid,
          note.slice(0, 120),
          hash,
          this.cfg.model,
          resp.meta.latencyMs,
          llm.usage ? JSON.stringify(llm.usage) : null,
          resp.answer,
          task ? JSON.stringify(task) : null,
          true,
          null
        ]
      )
      .catch((e) => console.warn('[Reasoning log]', e.message));

    this.stats.ms += resp.meta.latencyMs;
    return resp;
  }

  /* ---------- monitoring ---------- */
  getStats() {
    return {
      totalRequests: this.stats.req,
      cacheHits: this.stats.hit,
      avgLatencyMs: this.stats.req ? Math.round(this.stats.ms / this.stats.req) : 0,
      circuitBreaker: this.ai.state()
    };
  }
  clearCache() { this.cache.clear(); }

  /* ---------- test helpers ---------- */
  testCircuitBreaker() { this.ai.testTrip(); }
  resetCircuitBreaker() { this.ai.reset(); }
}