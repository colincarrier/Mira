-- Stage‑4A : Note‑Enhancement Queue  ----------------------------------------
BEGIN;

-- 1. queue table (only what we need now, easy to extend later)
CREATE TABLE IF NOT EXISTS memory.enhance_queue (
  id            BIGSERIAL PRIMARY KEY,
  note_id       INTEGER NOT NULL,  -- Match notes.id type
  user_id       TEXT NOT NULL,
  text          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','processing','completed','failed')),
  retry_count   INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  enqueued_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ
);

-- 2. index for fast "fetch next" query
CREATE INDEX IF NOT EXISTS idx_enhance_queue_status_id
  ON memory.enhance_queue(status, id);

-- 3. Foreign key constraint (after confirming notes table structure)
-- Will be added after verifying the correct notes table reference

COMMIT;