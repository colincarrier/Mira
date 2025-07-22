-- Stage‑3C  :  Scheduling support  -----------------------------------------
BEGIN;

ALTER TABLE memory.tasks
  ADD COLUMN IF NOT EXISTS parsed_due_date      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS due_date_confidence  REAL DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS status               TEXT NOT NULL DEFAULT 'pending'
                                               CHECK (status IN (
                                                 'pending','scheduled','completed','archived'
                                               ));

CREATE INDEX IF NOT EXISTS idx_tasks_sched
  ON memory.tasks(status, parsed_due_date)
  WHERE status = 'pending';

COMMIT;