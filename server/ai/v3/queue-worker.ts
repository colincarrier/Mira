// ---------- server/ai/v3/queue-worker.ts ------------
import { pool } from '../../db';
import { sseManager } from '../enhance/sse-manager';
import type { MiraResponse } from '../../../shared/mira-response';
import { detectIntent } from './intent';
import { buildPrompt } from './prompt';
import { callOpenAI } from './vendor-openai';
import { enrichLinks } from './link-enricher';

interface Job { noteId: string; retryCount: number }

export async function queueMiraV3(job: Job) { 
  // Process immediately for now - can add actual queue later
  process(job);
}

async function process({ noteId, retryCount }: Job) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock & idempotency
    const { rows: [note] } = await client.query(
      `SELECT id, content, mira_response, ai_enhanced 
         FROM notes WHERE id=$1 FOR UPDATE NOWAIT`, [noteId]);

    if (!note) throw new Error('Note not found');
    if (note.mira_response) {                       // already V3
      await client.query('COMMIT');
      return;
    }

    console.log(`🎯 [V3] Processing note ${noteId}: "${note.content.substring(0, 50)}..."`);

    const intent = detectIntent(note.content);
    const prompt = buildPrompt(note.content, intent);

    const started = Date.now();
    const aiJson = await callOpenAI(prompt);
    const aiResp = aiJson as MiraResponse;          // runtime validation omitted for brevity
    aiResp.meta.processingTimeMs = Date.now() - started;
    aiResp.meta.intent = intent;
    aiResp.meta.v = 3;

    // Link enrichment in parallel (do NOT block UI)
    const urls = (aiResp.links ?? []).map(l => l.url);
    const enriched = await enrichLinks(urls);
    if (enriched.length > 0) {
      aiResp.links = enriched;
    }

    await client.query(
      `UPDATE notes 
          SET mira_response=$1::jsonb,
              ai_enhanced = true,
              is_processing = false
        WHERE id=$2`,
      [aiResp, noteId]);

    await client.query('COMMIT');
    
    console.log(`✅ [V3] Completed note ${noteId} in ${aiResp.meta.processingTimeMs}ms`);
    sseManager.broadcast(String(noteId), { type:'complete', v:3 });
    
  } catch (err: any) {
    await client.query('ROLLBACK');
    
    if (err.code === '55P03') {
      console.log(`⏸️ [V3] Note ${noteId} locked, skipping`);
      return;               // locked elsewhere
    }
    
    // retry logic (max 3)
    if (retryCount < 3) {
      console.log(`🔄 [V3] Retrying note ${noteId} (attempt ${retryCount + 1})`);
      setTimeout(() =>
        queueMiraV3({ noteId, retryCount: retryCount + 1 }), 2**retryCount * 1000);
    } else {
      console.error(`❌ [V3] Job failed permanently for note ${noteId}:`, err);
    }
  } finally { 
    client.release(); 
  }
}