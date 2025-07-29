-- V3 Enhancement Queue Migration
-- Creates the new queue table for V3 Help-First processing

CREATE TABLE IF NOT EXISTS enhance_queue_v3 (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  attempts INTEGER DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_enhance_queue_v3_status ON enhance_queue_v3(status);
CREATE INDEX IF NOT EXISTS idx_enhance_queue_v3_created ON enhance_queue_v3(created_at);

-- Add comment for documentation
COMMENT ON TABLE enhance_queue_v3 IS 'V3 Help-First enhancement queue - processes notes with recursive intelligence';