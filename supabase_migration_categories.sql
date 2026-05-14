-- ============================================================
-- Migration: Kategorien-Verwaltung + Einkaufsliste
-- Im Supabase SQL Editor ausführen
-- ============================================================

-- 1. Kategorien-Tabelle
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alle lesen categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Alle schreiben categories" ON categories FOR ALL USING (true) WITH CHECK (true);

-- 2. Startwerte (7 Kategorien)
INSERT INTO categories (name) VALUES
  ('Rallye Obedience'),
  ('Obedience'),
  ('THS'),
  ('Hoopers'),
  ('Treibball'),
  ('allg. Turnierzubehör'),
  ('Verbrauchsmaterial')
ON CONFLICT (name) DO NOTHING;

-- 3. Neue Spalte category_id in equipment
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- 4. Bestehende sport-Werte zu category_id migrieren
UPDATE equipment e
SET category_id = c.id
FROM categories c
WHERE e.sport = c.name
  AND e.sport IS NOT NULL;

-- Prüf-Queries (optional):
-- SELECT count(*) FROM categories;                                          -- Erwartung: 7
-- SELECT count(*) FROM equipment WHERE sport IS NOT NULL AND category_id IS NULL;  -- Erwartung: 0

-- 5. Einkaufsliste
CREATE TABLE IF NOT EXISTS shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('open', 'bought')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alle lesen sl" ON shopping_list FOR SELECT USING (true);
CREATE POLICY "Alle schreiben sl" ON shopping_list FOR ALL USING (true) WITH CHECK (true);
