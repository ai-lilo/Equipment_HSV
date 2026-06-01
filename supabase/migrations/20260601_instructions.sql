-- Arbeitsanweisungen (Work Instructions)
-- Anleitungen können optional einem Equipment-Eintrag zugeordnet sein.
-- Ein Equipment kann mehrere Anleitungen haben.

CREATE TABLE IF NOT EXISTS instructions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instruction_steps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instruction_id UUID NOT NULL REFERENCES instructions(id) ON DELETE CASCADE,
  order_index    INTEGER NOT NULL,
  description    TEXT NOT NULL,
  media_url      TEXT,
  media_type     TEXT CHECK (media_type IN ('image', 'video')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at on instructions
CREATE OR REPLACE FUNCTION update_instructions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER instructions_updated_at
  BEFORE UPDATE ON instructions
  FOR EACH ROW EXECUTE FUNCTION update_instructions_updated_at();

-- RLS
ALTER TABLE instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruction_steps ENABLE ROW LEVEL SECURITY;

-- Alle Benutzer dürfen lesen
CREATE POLICY "Anleitungen lesen" ON instructions FOR SELECT USING (true);
CREATE POLICY "Anleitungsschritte lesen" ON instruction_steps FOR SELECT USING (true);

-- Schreiben: alle (App-seitig auf ADMIN eingeschränkt, wie restliche Tabellen)
CREATE POLICY "Anleitungen schreiben" ON instructions FOR ALL USING (true);
CREATE POLICY "Anleitungsschritte schreiben" ON instruction_steps FOR ALL USING (true);
