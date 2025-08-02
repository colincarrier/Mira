-- Add doc_json column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS doc_json JSONB;