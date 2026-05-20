CREATE TABLE tournament_helper_availability (
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES club_members(id) ON DELETE CASCADE,
  PRIMARY KEY (tournament_id, member_id)
);
ALTER TABLE tournament_helper_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON tournament_helper_availability FOR ALL TO anon USING (true) WITH CHECK (true);
