-- Stage‑3D  :  NOTIFICATION SYSTEM  -----------------------------------------
BEGIN;

-- 1️⃣  user → push‑subscription mapping (one row per user – overwrite on re‑register)
CREATE TABLE IF NOT EXISTS memory.push_subscriptions (
  user_id     TEXT PRIMARY KEY,
  endpoint    TEXT NOT NULL,
  p256dh_key  TEXT NOT NULL,
  auth_key    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2️⃣  optional user profile store (phone # now, room for future prefs)
CREATE TABLE IF NOT EXISTS memory.user_profiles (
  user_id       TEXT PRIMARY KEY,
  phone_number  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3️⃣  notification audit log
CREATE TABLE IF NOT EXISTS memory.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES memory.tasks(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL,
  channel       TEXT NOT NULL CHECK (channel IN ('push','sms')),
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload       JSONB,
  success       BOOLEAN NOT NULL,
  error_message TEXT
);

-- 4️⃣  extend task.status for clarifying flow
ALTER TABLE memory.tasks
  DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE memory.tasks
  ADD  CONSTRAINT tasks_status_check
       CHECK (status IN ('pending','clarifying','scheduled','completed','archived'));

-- 5️⃣  performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_task   ON memory.notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON memory.notifications(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_due            ON memory.tasks(status, parsed_due_date) WHERE status='scheduled';

COMMIT;