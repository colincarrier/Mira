-- Renames legacy columns for consistency
ALTER TABLE notes RENAME COLUMN updatedat TO updated_at;
ALTER TABLE notes RENAME COLUMN lastuseredit TO last_user_edit;