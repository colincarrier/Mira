// ---------- server/queue/enhance-v3.ts ------------
// V3 Enhancement queue system with Help-First processing

import { pool } from '../db';
import { processNoteV3 } from '../ai/v3/enhance/worker';

/**
 * Queue a note for V3 Help-First enhancement
 */
export async function queueEnhancementV3(noteId: number): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO enhance_queue_v3 (note_id, status) 
       VALUES ($1, 'pending')
       ON CONFLICT DO NOTHING`, // Prevent duplicates
      [noteId]
    );
    console.log(`🎯 [V3] Queued note ${noteId} for Help-First processing`);
  } catch (error) {
    console.error(`❌ [V3] Failed to queue note ${noteId}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process a batch of V3 enhancement jobs
 */
export async function processBatchV3(batchSize = 5): Promise<number> {
  const client = await pool.connect();
  let processed = 0;
  
  try {
    // Get pending jobs with row-level locking
    const result = await client.query(`
      SELECT id, note_id, attempts 
      FROM enhance_queue_v3
      WHERE status = 'pending' AND attempts < 3
      ORDER BY created_at
      LIMIT $1
      FOR UPDATE SKIP LOCKED
    `, [batchSize]);

    const jobs = result.rows;
    console.log(`🎯 [V3] Processing ${jobs.length} enhancement jobs`);

    for (const job of jobs) {
      try {
        // Mark as processing
        await client.query(
          `UPDATE enhance_queue_v3 
           SET status = 'processing', processed_at = NOW()
           WHERE id = $1`,
          [job.id]
        );

        // Process the note with V3 Help-First system
        await processNoteV3(job.note_id);

        // Mark as complete
        await client.query(
          `UPDATE enhance_queue_v3 
           SET status = 'done', processed_at = NOW()
           WHERE id = $1`,
          [job.id]
        );

        processed++;
        console.log(`✅ [V3] Completed note ${job.note_id}`);

      } catch (error) {
        console.error(`❌ [V3] Failed to process note ${job.note_id}:`, error);
        
        // Mark as error and increment attempts
        await client.query(
          `UPDATE enhance_queue_v3 
           SET status = 'error', 
               error = $1, 
               attempts = attempts + 1,
               processed_at = NOW()
           WHERE id = $2`,
          [(error as Error).message, job.id]
        );
      }
    }

  } catch (error) {
    console.error(`❌ [V3] Batch processing failed:`, error);
    throw error;
  } finally {
    client.release();
  }

  return processed;
}

/**
 * Clean up old completed jobs (older than 7 days)
 */
export async function cleanupV3Queue(): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      DELETE FROM enhance_queue_v3 
      WHERE status IN ('done', 'error') 
      AND processed_at < NOW() - INTERVAL '7 days'
    `);
    
    const cleaned = result.rowCount || 0;
    if (cleaned > 0) {
      console.log(`🧹 [V3] Cleaned up ${cleaned} old queue entries`);
    }
    
    return cleaned;
  } finally {
    client.release();
  }
}

/**
 * Get queue statistics for monitoring
 */
export async function getV3QueueStats() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_seconds
      FROM enhance_queue_v3 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
    `);
    
    return result.rows.reduce((acc, row) => {
      acc[row.status] = {
        count: parseInt(row.count),
        avgProcessingSeconds: row.avg_processing_seconds ? parseFloat(row.avg_processing_seconds) : null
      };
      return acc;
    }, {} as Record<string, any>);
  } finally {
    client.release();
  }
}