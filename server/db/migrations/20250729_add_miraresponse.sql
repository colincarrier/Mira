-- --------------------------------------------------------------------
--   Add `mira_response` JSONB column for *new* notes only.
--   Existing `rich_context` stays untouched for back-compat / rollback
-- --------------------------------------------------------------------
ALTER TABLE notes
  ADD COLUMN mira_response JSONB,
  ADD COLUMN mira_response_created_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS notes_mira_response_gin
  ON notes USING GIN (mira_response jsonb_path_ops);