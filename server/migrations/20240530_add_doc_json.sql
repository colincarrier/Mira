ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS doc_json JSONB;

-- Rollback command (commented out for safety):
-- ALTER TABLE notes DROP COLUMN IF EXISTS doc_json;