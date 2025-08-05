import { contextPool as pool } from '../context/db-pool.js';
import { ReasoningEngine } from '../reasoning/reasoning-engine.js';
import { Stage4AValidator } from '../reasoning/stage4a-validator.js';
import { enhancementEmitter } from './sse-manager.js';
import type { EnhancementContext, EnhancementProgress, MemoryFact } from '../types/enhancement-context.js';

// Enhanced configuration with environment variable support
const POLL_INTERVAL_MS = Number(process.env.ENHANCE_POLL_MS) || 3000;
const BATCH_SIZE = Number(process.env.ENHANCE_BATCH_SIZE) || 5;
const MAX_RETRIES = Number(process.env.ENHANCE_MAX_RETRIES) || 3;
const GUARD_SCHEMA = process.env.ENHANCE_SCHEMA_GUARD === 'true';

interface EnhanceJob {
  id: number;
  note_id: number;
  user_id: string;
  text: string;
  retry_count: number;
}

export class MinimalEnhancementWorker {
  private engine = new ReasoningEngine();
  private running = false;
  private timer?: NodeJS.Timeout;

  /** Start polling loop with stale job recovery */
  async start(): Promise<void> {
    if (this.running) return;
    
    // Recover jobs left in 'processing' after an unclean shutdown
    try {
      const result = await pool.query(`
        UPDATE memory.enhance_queue
        SET status = 'pending',
            retry_count = retry_count + 1,
            error_message = 'auto-recovered from stale processing state'
        WHERE status = 'processing'
          AND started_at < NOW() - INTERVAL '10 minutes'
      `);
      
      if (result.rowCount && result.rowCount > 0) {
        console.log(`[Enhancer] Recovered ${result.rowCount} stale jobs`);
      }
    } catch (error: any) {
      console.warn('[Enhancer] Stale job recovery failed:', error.message);
    }
    
    this.running = true;
    console.log('[Enhancer] worker started');
    this.schedule();
  }

  /** Graceful stop */
  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    console.log('[Enhancer] worker stopped');
  }

  // ---------- Internal helpers ---------- //

  private schedule(): void {
    if (!this.running) return;
    this.timer = setTimeout(() => {
      this.processBatch()
        .catch(e => console.error('[Enhancer] batch error:', e))
        .finally(() => this.schedule());
    }, POLL_INTERVAL_MS);
  }

  /** Fetch a batch (atomic status change → processing) */
  private async fetchBatch(): Promise<EnhanceJob[]> {
    const { rows } = await pool.query<EnhanceJob>(
      `UPDATE memory.enhance_queue AS q
         SET status = 'processing',
             started_at = NOW()
       FROM (
         SELECT id
           FROM memory.enhance_queue
          WHERE status = 'pending'
          ORDER BY id
          LIMIT $1
          FOR UPDATE SKIP LOCKED
       ) AS sub
       WHERE q.id = sub.id
       RETURNING q.id, q.note_id, q.user_id, q.text, q.retry_count`,
      [BATCH_SIZE]
    );
    return rows;
  }

  private async processBatch(): Promise<void> {
    const jobs = await this.fetchBatch();
    if (jobs.length === 0) return;

    console.log(`[Enhancer] Processing batch of ${jobs.length} jobs`);
    await Promise.all(jobs.map(j => this.processJob(j)));
  }

  private async processJob(job: EnhanceJob): Promise<void> {
    const startTime = Date.now();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // IDEMPOTENCY CHECK with row lock (prevents race conditions)
      let lockResult;
      try {
        lockResult = await client.query(
          'SELECT id, content, user_id, ai_enhanced FROM notes WHERE id = $1 FOR UPDATE NOWAIT',
          [job.note_id]
        );
      } catch (err: any) {
        if (err.code === '55P03') { // Lock not available immediately
          console.log(`[Skip] Note ${job.note_id} currently being processed by another worker`);
          await client.query('ROLLBACK');
          return; // Graceful exit, don't queue retry
        }
        throw err; // Re-throw other errors
      }
      
      if (lockResult.rows.length === 0) {
        throw new Error(`Note ${job.note_id} not found`);
      }
      
      const note = lockResult.rows[0];
      
      // Skip if already enhanced (idempotency)
      if (note.ai_enhanced) {
        console.log(`[Skip] Note ${job.note_id} already enhanced`);
        await client.query('COMMIT');
        // Mark queue job as completed
        await pool.query(
          `UPDATE memory.enhance_queue SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [job.id]
        );
        return;
      }
      
      // Initialize context
      const context: EnhancementContext = {
        noteId: job.note_id.toString(),
        userId: note.user_id,
        content: note.content,
        memoryFacts: []
      };
      
      this.emitProgress(job.note_id.toString(), 'memory', 'Retrieving relevant memories...');
      
      // SECURE memory facts retrieval with relevance scoring
      if (context.userId) {
        context.memoryFacts = await this.collectMemoryFacts(client, context.userId, context.content);
        console.log(`[Memory] Retrieved ${context.memoryFacts.length} relevant facts`);
      }
      
      this.emitProgress(job.note_id.toString(), 'reasoning', 'Generating intelligent response...');
      
      // Enhanced reasoning with context
      const reasoningResult = await this.engine.processNote(job.user_id, job.text, {
        includeContext: true,
        skipCache: false
      });
      
      // Response validation and fallback
      if (!reasoningResult.answer || reasoningResult.answer.trim() === '' || typeof reasoningResult.answer !== 'string') {
        reasoningResult.answer = "I need more context to help with this. Could you provide more details?";
        reasoningResult.meta = { 
          ...reasoningResult.meta, 
          confidence: 0.3
        };
      }
      
      // Ensure tasks array exists for context interface
      const enhancedResult = {
        ...reasoningResult,
        tasks: reasoningResult.tasks || []
      };
      
      context.reasoningResult = enhancedResult;
      
      // Stage-4A validation before database storage
      const rawResponse = JSON.stringify(enhancedResult);
      const validation = Stage4AValidator.validate(rawResponse);
      
      if (!validation.isValid) {
        console.error(`[Enhancer] Stage-4A validation failed for note ${job.note_id}:`, validation.errors);
        throw new Error(`Stage-4A validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Use sanitized response if provided
      const finalResponse = validation.sanitized || rawResponse;
      
      // Update note with results
      await client.query(`
        UPDATE notes 
        SET 
          rich_context = $1::text,
          ai_enhanced = true,
          is_processing = false
        WHERE id = $2
      `, [finalResponse, job.note_id]);
      
      // Mark queue job as completed
      await client.query(
        `UPDATE memory.enhance_queue SET status = 'completed', completed_at = NOW() WHERE id = $1`,
        [job.id]
      );
      
      await client.query('COMMIT');
      
      const duration = Date.now() - startTime;
      this.emitProgress(job.note_id.toString(), 'complete', `Enhancement complete in ${duration}ms`);
      
      console.log(`[Enhancer] Enhanced note ${job.note_id} in ${duration}ms ✅`);
      
    } catch (error: any) {
      await client.query('ROLLBACK');
      this.emitProgress(job.note_id.toString(), 'error', `Enhancement failed: ${error.message}`);
      
      console.error(`[Enhancer] Failed to process note ${job.note_id}:`, error);
      await this.handleFailure(job, error);
      
      throw error;
      
    } finally {
      client.release();
    }
  }

  // Helper: Secure memory facts retrieval with relevance scoring
  private async collectMemoryFacts(client: any, userId: string, content: string): Promise<MemoryFact[]> {
    // Sanitize input to prevent SQL injection
    const cleanKeywords = content
      .toLowerCase()
      .split(/\s+/)
      .filter(kw => kw.length > 2 && /^[a-zA-Z0-9]+$/.test(kw))
      .slice(0, 10); // Limit keywords
    
    if (cleanKeywords.length === 0) return [];
    
    const factsResult = await client.query(`
      WITH keyword_matches AS (
        SELECT 
          f.*,
          (
            SELECT COUNT(DISTINCT kw)
            FROM unnest($2::text[]) AS kw
            WHERE f.name ILIKE '%' || kw || '%' 
               OR f.metadata::text ILIKE '%' || kw || '%'
          ) as match_count,
          CASE 
            WHEN last_accessed > NOW() - INTERVAL '1 day' THEN 0.5
            WHEN last_accessed > NOW() - INTERVAL '7 days' THEN 0.3
            ELSE 0.1
          END as recency_boost
        FROM memory.facts f
        WHERE f.user_id = $1
      )
      SELECT *,
        (COALESCE(extraction_confidence, 0.5) * 0.5 + 
         match_count * 0.3 + 
         recency_boost * 0.2) as relevance_score
      FROM keyword_matches
      WHERE match_count > 0 OR recency_boost > 0.3
      ORDER BY relevance_score DESC
      LIMIT 10
    `, [userId, cleanKeywords]);
    
    const facts = factsResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      extraction_confidence: row.extraction_confidence || 0.5,
      last_accessed: row.last_accessed
    }));
    
    // Update access timestamps (throttled)
    if (facts.length > 0) {
      const factIds = facts.map((f: MemoryFact) => f.id);
      await client.query(`
        UPDATE memory.facts 
        SET last_accessed = NOW() 
        WHERE id = ANY($1::uuid[]) 
        AND (last_accessed IS NULL OR last_accessed < NOW() - INTERVAL '1 hour')
      `, [factIds]);
    }
    
    return facts;
  }

  // Progress emitter function
  private emitProgress(noteId: string, stage: string, message: string) {
    const progress: EnhancementProgress = {
      type: stage === 'complete' ? 'complete' : stage === 'error' ? 'error' : 'progress',
      stage: stage as any,
      message,
      timestamp: new Date().toISOString()
    };
    
    enhancementEmitter.emit(`enhancement:${noteId}`, progress);
    enhancementEmitter.emit('broadcast', { noteId, payload: progress });
  }



  private async handleFailure(job: EnhanceJob, err: any): Promise<void> {
    console.error(`[Enhancer] Job ${job.id} failed:`, err.message);
    
    const next = job.retry_count + 1;
    const status = next > MAX_RETRIES ? 'failed' : 'pending';

    await pool.query(
      `UPDATE memory.enhance_queue
          SET status = $2,
              retry_count = $3,
              error_message = $4
        WHERE id = $1`,
      [job.id, status, next, (err.message || '').slice(0, 500)]
    );

    if (status === 'failed') {
      console.error(`[Enhancer] job ${job.id} permanently failed after ${next} attempts ❌`);
      
      // Clear processing flag even on permanent failure
      try {
        await pool.query(
          `UPDATE notes SET is_processing = false WHERE id = $1`,
          [job.note_id]
        );
      } catch (updateErr) {
        console.error(`[Enhancer] Failed to clear processing flag for note ${job.note_id}:`, updateErr);
      }
    } else {
      console.warn(`[Enhancer] job ${job.id} failed (attempt ${next}/${MAX_RETRIES}), will retry`);
    }
  }
}

// Singleton bootstrap
let worker: MinimalEnhancementWorker | null = null;

export function startEnhancer(): void {
  if (!worker) {
    worker = new MinimalEnhancementWorker();
    worker.start();
    
    // Graceful shutdown handlers
    process.on('SIGINT', () => { 
      console.log('[EnhancementWorker] SIGINT'); 
      worker?.stop(); 
    });
    process.on('SIGTERM', () => { 
      console.log('[EnhancementWorker] SIGTERM'); 
      worker?.stop(); 
    });
  }
}

// Health check and monitoring functions
export async function getQueueStats() {
  const { rows } = await pool.query(`
    SELECT * FROM memory.enhance_queue_stats
  `);
  return {
    stats: rows,
    activeJobs: worker ? (worker as any).activeJobs?.size || 0 : 0,
    isRunning: worker ? (worker as any).running || false : false
  };
}

export async function getFailedJobs(limit: number = 10): Promise<any[]> {
  const { rows } = await pool.query(
    `SELECT id, note_id, user_id, error_message, retry_count, created_at
     FROM memory.enhance_queue
     WHERE status = 'failed'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
}