#!/usr/bin/env bash
set -Eeuo pipefail
############################################
#  V3  ·  STAGE‑2‑A  ·  SIMPLE MEMORY MVP  #
#  Replit‑ready ‑ zero Docker, zero ORMs   #
############################################

echo -e "\n🚀  Stage 2‑A — installing simple per‑user memory\n"

### ────────────────────────────────────
### 0. PRE‑FLIGHT CHECKS
### ────────────────────────────────────
[[ -z "${DATABASE_URL:-}" ]] && { echo "❌  DATABASE_URL env‑var not set"; exit 1; }

echo "🔌  Verifying database connection…"
psql "$DATABASE_URL" -c "SELECT 1" >/dev/null || {
  echo "❌  Cannot connect to database with DATABASE_URL"; exit 1; }
echo "✅  PostgreSQL reachable\n"

### ────────────────────────────────────
### 1. NPM DEPENDENCIES
### ────────────────────────────────────
echo "📦  Ensuring Node dependencies…"
npm list pg >/dev/null 2>&1 || npm install --save pg @types/pg >/dev/null
npm list uuid >/dev/null 2>&1 || npm install --save uuid @types/uuid >/dev/null
npm list tsx >/dev/null 2>&1  || npm install -D tsx >/dev/null
echo "✅  Dependencies present\n"

### ────────────────────────────────────
### 2. DATABASE SCHEMA  (idempotent)
### ────────────────────────────────────
echo "📊  Creating/patching memory schema…"

psql "$DATABASE_URL" <<'SQL'
-- Enable UUID helpers (safe if already present)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SCHEMA IF NOT EXISTS memory;

CREATE TABLE IF NOT EXISTS memory.facts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        TEXT      NOT NULL,
  entity_id      UUID      NOT NULL DEFAULT uuid_generate_v4(),
  name           TEXT      NOT NULL,
  type           TEXT      NOT NULL CHECK (
                   type IN ('person','pet','place','org','project','concept')),
  aliases        TEXT[]    DEFAULT '{}'::TEXT[],
  contexts       TEXT[]    DEFAULT '{}'::TEXT[],
  frequency      INT       DEFAULT 1,
  strength       FLOAT     DEFAULT 1.0,
  last_mentioned TIMESTAMPTZ DEFAULT NOW(),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  metadata       JSONB     DEFAULT '{}',
  UNIQUE(user_id, name, type)
);

CREATE TABLE IF NOT EXISTS memory.events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT      NOT NULL,
  timestamp   TIMESTAMPTZ     DEFAULT NOW(),
  type        TEXT      NOT NULL,
  action      TEXT      NOT NULL,
  summary     TEXT,
  entity_ids  UUID[]    DEFAULT '{}'::UUID[],
  importance  INT       DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  metadata    JSONB     DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS memory.patterns (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       TEXT      NOT NULL,
  pattern_type  TEXT      NOT NULL,
  signature     TEXT      NOT NULL,
  pattern       JSONB     NOT NULL,
  confidence    FLOAT     DEFAULT 0,
  observations  INT       DEFAULT 0,
  last_observed TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, pattern_type, signature)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_facts_user_name
  ON memory.facts (user_id, name);
CREATE INDEX IF NOT EXISTS idx_facts_frequency
  ON memory.facts (user_id, frequency DESC);
CREATE INDEX IF NOT EXISTS idx_events_user_time
  ON memory.events (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_user_conf
  ON memory.patterns (user_id, confidence DESC);
SQL

echo "✅  Schema ready\n"

### ────────────────────────────────────
### 3. TYPES + MEMORY MODULE
### ────────────────────────────────────
echo "📝  Writing TypeScript memory client…"
mkdir -p server/ai/v3/memory

cat > server/ai/v3/memory/types.ts <<'TS'
export type EntityKind =
  | 'person' | 'pet' | 'place' | 'org' | 'project' | 'concept';

export interface Fact {
  id: string;
  user_id: string;
  entity_id: string;
  name: string;
  type: EntityKind;
  aliases: string[];
  contexts: string[];
  frequency: number;
  strength: number;
  last_mentioned: Date;
  created_at: Date;
  metadata: Record<string, unknown>;
}

export interface Event {
  id: string;
  user_id: string;
  timestamp: Date;
  type: string;
  action: string;
  summary?: string;
  entity_ids: string[];
  importance: number;
  metadata: Record<string, unknown>;
}

export interface Pattern {
  id: string;
  user_id: string;
  pattern_type: string;
  signature: string;
  pattern: unknown;
  confidence: number;
  observations: number;
  last_observed: Date;
  created_at: Date;
}

export interface MemResult<T> {
  success: true;  data: T;
} | {
  success: false; error: string;
}
TS
# ------------------------------------------------------------
cat > server/ai/v3/memory/simple-memory.ts <<'TS'
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
TS

### ────────────────────────────────────
### 4. ONE‑FILE SELF‑TEST  (tsx)
### ────────────────────────────────────
echo "🧪  Adding quick integration test…"
mkdir -p tests/v3/memory
cat > tests/v3/memory/memory.test.tsx <<'TSX'
import { Memory } from '../../../server/ai/v3/memory/simple-memory.js';

(async () => {
  const uid = `u-${Date.now()}`;
  const fail = (m: string) => { console.error('❌', m); process.exit(1); };

  // 1. remember
  const r1 = await Memory.rememberFact(uid, 'Santa', 'pet');
  if (!r1.success) fail(r1.error!);

  // 2. recall
  const r2 = await Memory.recallFacts(uid, 'Santa');
  if (!r2.success || r2.data.length !== 1) fail('Recall failed');

  // 3. event log
  const ev = await Memory.logEvent(uid, 'note', 'create', 'Walk Santa');
  if (!ev.success) fail(ev.error!);

  // 4. pattern upsert
  const p = await Memory.upsertPattern(uid, 'sequence', 'walk->feed', { a: 1 });
  if (!p.success) fail(p.error!);

  console.log('🎉  All Stage‑2‑A memory tests passed');
  process.exit(0);
})();
TSX

### ────────────────────────────────────
### 5. NPM SCRIPT + RUN TEST
### ────────────────────────────────────
echo "📦  Adding npm script & running test…"
npm pkg set scripts.test:memory="tsx tests/v3/memory/memory.test.tsx" >/dev/null
npm run test:memory --silent

echo -e "\n✅  Stage 2‑A complete.  Commit with:\n   git add -A && git commit -m 'Stage 2‑A: simple memory layer'\n"