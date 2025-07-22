import { contextPool as pool } from '../context/db-pool.js';
import { ReasoningEngine } from '../reasoning/reasoning-engine.js';

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
    try {
      console.log(`[Enhancer] Processing note ${job.note_id} for user ${job.user_id}`);
      
      // Run full Intelligence V2 pipeline
      const result = await this.engine.processNote(job.user_id, job.text, {
        includeContext: true,
        includeMemory: true,
        includeReasoning: true
      });

      await this.applyEnhancement(job.note_id, result);

      // Mark completed
      await pool.query(
        `UPDATE memory.enhance_queue
            SET status = 'completed',
                completed_at = NOW()
          WHERE id = $1`,
        [job.id]
      );
      
      console.log(`[Enhancer] Enhanced note ${job.note_id} ✅`);
    }
    catch (err: any) {
      await this.handleFailure(job, err);
    }
  }

  private async applyEnhancement(noteId: number, rc: unknown): Promise<void> {
    // Check schema before starting transaction if guard is enabled
    if (GUARD_SCHEMA) {
      const { rows } = await pool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'notes' 
          AND column_name IN ('is_processing','rich_context','ai_enhanced')
      `);
      if (rows.length !== 3) {
        throw new Error('Notes table missing expected columns for enhancement');
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE notes
            SET ai_enhanced  = true,
                rich_context = $2,
                is_processing = false
          WHERE id = $1`,
        [noteId, JSON.stringify(rc)]
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
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