-- Make name nullable (will be filled in later, cleared on template creation)
ALTER TABLE tournament_helpers ALTER COLUMN name DROP NOT NULL;

-- Add time slot field (carried over to templates)
ALTER TABLE tournament_helpers ADD COLUMN IF NOT EXISTS time_slot TEXT;
