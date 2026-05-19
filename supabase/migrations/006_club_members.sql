CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON club_members FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE tournament_helpers
  ADD COLUMN member_id UUID REFERENCES club_members(id) ON DELETE SET NULL,
  ADD COLUMN time_start TEXT,
  ADD COLUMN time_end TEXT;

ALTER TABLE tournament_helpers DROP COLUMN IF EXISTS time_slot;
ALTER TABLE tournament_helpers DROP COLUMN IF EXISTS name;
