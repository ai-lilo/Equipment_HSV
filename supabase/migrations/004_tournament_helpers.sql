CREATE TABLE tournament_helpers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tournament_helpers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tournament_helpers FOR ALL TO anon USING (true) WITH CHECK (true);
