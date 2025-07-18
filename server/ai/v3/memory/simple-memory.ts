import pg from 'pg';
import { v4 as uuid } from 'uuid';
import { Fact, Event, Pattern, EntityKind, MemResult } from './types.js';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000
});

/* ── tiny local cache (per instance, optional) ────────────── */
const cache = new Map<string, { expires: number; data: unknown }>();
const setCache = (k: string, d: unknown, ttl = 300) =>
  cache.set(k, { expires: Date.now() + ttl * 1_000, data: d });
const getCache = <T>(k: string): T | null => {
  const v = cache.get(k);
  if (!v) return null;
  if (v.expires < Date.now()) { cache.delete(k); return null; }
  return v.data as T;
};

/* ── public API ───────────────────────────────────────────── */
export const Memory = {
  /* FACTS ──────────────────────────────────────────────── */
  async rememberFact(
    userId: string,
    name: string,
    type: EntityKind,
    opts: { aliases?: string[]; contexts?: string[]; metadata?: any } = {}
  ): Promise<MemResult<Fact>> {
    try {
      const { rows } = await pool.query<Fact>(`
        INSERT INTO memory.facts (user_id,name,type,aliases,contexts,metadata)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (user_id, name, type)
        DO UPDATE SET
          frequency = memory.facts.frequency + 1,
          strength  = LEAST(memory.facts.strength * 1.1, 1.0),
          last_mentioned = NOW(),
          aliases   = array_cat(memory.facts.aliases, $4)
        RETURNING *`,
        [userId, name, type,
         opts.aliases ?? [],
         opts.contexts ?? [],
         opts.metadata ?? {}]);
      cache.delete(`facts:${userId}:*`);
      return { success: true, data: rows[0] };
    } catch (err: any) {
      return { success: false, error: String(err.message || err) };
    }
  },

  async recallFacts(
    userId: string,
    query = '',
    limit = 10
  ): Promise<MemResult<Fact[]>> {
    try {
      const key = `facts:${userId}:${query}`;
      const cached = getCache<Fact[]>(key);
      if (cached) return { success: true, data: cached };

      const { rows } = await pool.query<Fact>(`
        SELECT * FROM memory.facts
        WHERE user_id = $1
          AND ($2 = '' OR name ILIKE $2)
        ORDER BY frequency DESC, last_mentioned DESC
        LIMIT $3`,
        [userId, query ? `%${query}%` : '', limit]);

      setCache(key, rows);
      return { success: true, data: rows };
    } catch (err: any) {
      return { success: false, error: String(err.message || err) };
    }
  },

  /* EVENTS ─────────────────────────────────────────────── */
  async logEvent(
    userId: string,
    type: string,
    action: string,
    summary?: string,
    entityIds: string[] = []
  ): Promise<MemResult<Event>> {
    try {
      const { rows } = await pool.query<Event>(`
        INSERT INTO memory.events
          (user_id,type,action,summary,entity_ids)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *`,
        [userId, type, action, summary ?? null, entityIds]);
      return { success: true, data: rows[0] };
    } catch (err: any) {
      return { success: false, error: String(err.message || err) };
    }
  },

  async recentEvents(
    userId: string,
    days = 7,
    limit = 100
  ): Promise<MemResult<Event[]>> {
    try {
      const { rows } = await pool.query<Event>(`
        SELECT * FROM memory.events
        WHERE user_id = $1 AND timestamp >= NOW() - ($2::INT || ' days')::INTERVAL
        ORDER BY timestamp DESC
        LIMIT $3`,
        [userId, days, limit]);
      return { success: true, data: rows };
    } catch (err: any) {
      return { success: false, error: String(err.message || err) };
    }
  },

  /* PATTERNS (very light placeholder) ─────────────────── */
  async upsertPattern(
    userId: string,
    patternType: string,
    signature: string,
    pattern: unknown
  ): Promise<MemResult<Pattern>> {
    try {
      const { rows } = await pool.query<Pattern>(`
        INSERT INTO memory.patterns
          (user_id,pattern_type,signature,pattern,confidence,observations)
        VALUES ($1,$2,$3,$4,0.1,1)
        ON CONFLICT (user_id,pattern_type,signature)
        DO UPDATE SET
          observations = memory.patterns.observations + 1,
          confidence   = LEAST(memory.patterns.confidence + 0.05, 1.0),
          pattern      = $4,
          last_observed = NOW()
        RETURNING *`,
        [userId, patternType, signature, JSON.stringify(pattern)]);
      return { success: true, data: rows[0] };
    } catch (err: any) {
      return { success: false, error: String(err.message || err) };
    }
  }
};
