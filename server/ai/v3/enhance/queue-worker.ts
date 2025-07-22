import { contextPool as pool } from '../context/db-pool.js';
import { ReasoningEngine } from '../reasoning/reasoning-engine.js';

const engine = new ReasoningEngine();
const BATCH = parseInt(process.env.ENHANCE_BATCH ?? '5', 10);
const BACKOFF = parseInt(process.env.ENHANCE_BACKOFF_MS ?? '10000', 10);
const MAX_RETRIES = 3;

interface EnhanceJob {
  id: number;
  note_id: number;
  user_id: string;
  text: string;
  retry_count: number;
}

async function fetchBatch(): Promise<EnhanceJob[]> {
  const { rows } = await pool.query(
    `UPDATE memory.enhance_queue
     SET status = 'processing', started_at = NOW()
     WHERE id IN (
       SELECT id FROM memory.enhance_queue
       WHERE status = 'pending'
       ORDER BY id
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, note_id, user_id, text, retry_count`,
    [BATCH]
  );
  return rows;
}

async function processJob(job: EnhanceJob): Promise<void> {
  try {
    console.log(`[Enhancer] Processing note ${job.note_id} for user ${job.user_id}`);
    
    // Run full Intelligence V2 pipeline
    const result = await engine.processNote(job.user_id, job.text, {
      includeContext: true,  // Enable full pipeline processing
      skipCache: false       // Use caching for performance
    });
    
    // Apply enhancement to note
    await applyEnhancement(job.note_id, result);
    
    // Mark completed
    await pool.query(
      `UPDATE memory.enhance_queue
       SET status='completed', completed_at = NOW()
       WHERE id = $1`,
      [job.id]
    );
    
    console.log(`[Enhancer] Enhanced note ${job.note_id} - AI processing complete`);
  } catch (e: any) {
    console.error('[Enhancer] job failed', job.id, e.message);
    const retry = job.retry_count + 1;
    await pool.query(
      `UPDATE memory.enhance_queue
       SET status = CASE WHEN $2 < $3 THEN 'pending' ELSE 'failed' END,
           retry_count = $2,
           error_message = $4
       WHERE id = $1`,
      [job.id, retry, MAX_RETRIES, e.message.slice(0, 200)]
    );
  }
}

async function applyEnhancement(noteId: number, aiResult: any): Promise<void> {
  await pool.query(
    `UPDATE notes
     SET ai_enhanced = true,
         rich_context = $2
     WHERE id = $1`,
    [noteId, JSON.stringify(aiResult)]
  );
}

async function tick(): Promise<void> {
  try {
    const batch = await fetchBatch();
    if (batch.length > 0) {
      console.log(`[Enhancer] Processing ${batch.length} jobs`);
      await Promise.all(batch.map(processJob));
    }
  } catch (e) {
    console.error('[Enhancer] tick failed:', e);
  }
}

export function startEnhancer(): void {
  console.info('[Enhancer] worker started');
  const timer = setInterval(tick, BACKOFF);
  timer.unref(); // allow clean shutdown
  // quick first run
  tick().catch(console.error);
}

// Health check function
export async function getQueueStats() {
  const { rows } = await pool.query(`
    SELECT status, COUNT(*) as count 
    FROM memory.enhance_queue 
    WHERE enqueued_at > NOW() - INTERVAL '24 hours'
    GROUP BY status
  `);
  return rows;
}