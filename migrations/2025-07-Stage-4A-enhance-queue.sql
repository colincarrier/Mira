-- Stage-4A Enhanced Queue Migration
-- Production-ready enhancement queue with robust error handling and monitoring
BEGIN;

-- Create enhanced queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS memory.enhance_queue_v2 (
  id            BIGSERIAL PRIMARY KEY,
  note_id       BIGINT  NOT NULL,
  user_id       TEXT    NOT NULL,
  text          TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'pending'
                 CHECK  (status IN ('pending','processing','completed','failed')),
  retry_count   INT     NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  
  -- Ensure every note is queued at most once
  UNIQUE (note_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_enhance_queue_v2_pending
  ON memory.enhance_queue_v2(id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_enhance_queue_v2_processing
  ON memory.enhance_queue_v2(started_at)
  WHERE status = 'processing';

-- Migrate existing data from old queue if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'memory' AND table_name = 'enhance_queue') THEN
    
    -- Migrate pending and processing jobs
    INSERT INTO memory.enhance_queue_v2 (note_id, user_id, text, status, retry_count, error_message, created_at, started_at, completed_at)
    SELECT note_id, user_id, text, status, retry_count, error_message, enqueued_at, started_at, completed_at
    FROM memory.enhance_queue
    WHERE status IN ('pending', 'processing')
    ON CONFLICT (note_id) DO NOTHING;
    
    -- Log migration results
    RAISE NOTICE 'Migrated % jobs from old enhance_queue', 
      (SELECT COUNT(*) FROM memory.enhance_queue WHERE status IN ('pending', 'processing'));
      
    -- Rename old table for backup
    ALTER TABLE memory.enhance_queue RENAME TO enhance_queue_backup;
    
  END IF;
END$$;

-- Rename new table to standard name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_schema = 'memory' AND table_name = 'enhance_queue_v2') THEN
    DROP TABLE IF EXISTS memory.enhance_queue CASCADE;
    ALTER TABLE memory.enhance_queue_v2 RENAME TO enhance_queue;
  END IF;
END$$;

-- Add foreign key constraint after ensuring notes table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'notes' AND (table_schema = 'public' OR table_schema = 'memory')) THEN
    
    -- Determine correct schema for notes table
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'notes') THEN
      ALTER TABLE memory.enhance_queue 
        ADD CONSTRAINT fk_enhance_queue_note 
        FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE CASCADE;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_schema = 'memory' AND table_name = 'notes') THEN
      ALTER TABLE memory.enhance_queue 
        ADD CONSTRAINT fk_enhance_queue_note 
        FOREIGN KEY (note_id) REFERENCES memory.notes(id) ON DELETE CASCADE;
    END IF;
    
  END IF;
END$$;

-- Create monitoring view for queue statistics
CREATE OR REPLACE VIEW memory.enhance_queue_stats AS
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_processing_seconds,
  MAX(retry_count) as max_retries,
  MIN(created_at) as oldest_job,
  MAX(created_at) as newest_job
FROM memory.enhance_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

COMMIT;