-- Stage‑3A • Task persistence (idempotent)
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'memory') THEN
    RAISE EXCEPTION 'memory schema missing – run Stage‑2A first';
  END IF;

  IF NOT EXISTS (
       SELECT 1
         FROM information_schema.tables
        WHERE table_schema = 'memory'
          AND table_name   = 'tasks'
  ) THEN
    CREATE TABLE memory.tasks (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id               TEXT            NOT NULL,
      title                 TEXT            NOT NULL
                                         CHECK (length(trim(title)) BETWEEN 2 AND 200),
      natural_text          TEXT,
      priority              TEXT            NOT NULL DEFAULT 'medium'
                                         CHECK (priority IN ('low','medium','high')),
      status                TEXT            NOT NULL DEFAULT 'pending'
                                         CHECK (status  IN ('pending','completed','archived')),
      parsed_due_date       TIMESTAMPTZ,
      due_date_confidence   REAL            NOT NULL DEFAULT 0
                                         CHECK (due_date_confidence BETWEEN 0 AND 1),
      confidence            REAL            NOT NULL
                                         CHECK (confidence BETWEEN 0 AND 1),
      source_reasoning_log_id UUID
                                         REFERENCES memory.reasoning_logs(id)
                                         ON DELETE SET NULL,
      created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
      completed_at          TIMESTAMPTZ,
      UNIQUE(user_id, title)  -- soft dedupe
    );

    CREATE INDEX idx_tasks_user_status  ON memory.tasks(user_id, status);
    CREATE INDEX idx_tasks_user_created ON memory.tasks(user_id, created_at DESC);
    CREATE INDEX idx_tasks_due_date     ON memory.tasks(parsed_due_date);
  END IF;
END$$;

COMMIT;