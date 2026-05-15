-- ============================================================
-- Turnier-Organisations-Modul HSV Pegnitz
-- Migration 001: Tabellen + RLS
-- Ausführen in: Supabase SQL Editor
-- https://supabase.com/dashboard/project/qguzxknqrdvzsnbaziym/sql/new
-- ============================================================

-- ------------------------------------------------------------
-- 1. TOURNAMENTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournaments (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  date          date        NOT NULL,
  template_type text,
  archived      boolean     NOT NULL DEFAULT false,
  is_template   boolean     NOT NULL DEFAULT false,
  created_by    uuid        REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournaments_select" ON tournaments
  FOR SELECT TO anon USING (true);

CREATE POLICY "tournaments_all" ON tournaments
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 2. TOURNAMENT_CATEGORIES
-- Hinweis: Heißt tournament_categories (nicht categories),
-- da bereits eine categories-Tabelle für Equipment existiert.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournament_categories (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid    NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name          text    NOT NULL,
  sort_order    integer NOT NULL DEFAULT 0
);

ALTER TABLE tournament_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournament_categories_select" ON tournament_categories
  FOR SELECT TO anon USING (true);

CREATE POLICY "tournament_categories_all" ON tournament_categories
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 3. TASKS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         uuid        NOT NULL REFERENCES tournament_categories(id) ON DELETE CASCADE,
  title               text        NOT NULL,
  status              text        NOT NULL DEFAULT 'nicht_begonnen'
                                  CHECK (status IN ('nicht_begonnen','in_arbeit','abgeschlossen')),
  responsible_user_id uuid        REFERENCES users(id) ON DELETE SET NULL,
  due_date            date,
  notes               text,
  created_by          uuid        REFERENCES users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks
  FOR SELECT TO anon USING (true);

CREATE POLICY "tasks_all" ON tasks
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 4. TOURNAMENT_TEMPLATES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournament_templates (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  source_tournament_id  uuid REFERENCES tournaments(id) ON DELETE SET NULL
);

ALTER TABLE tournament_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournament_templates_select" ON tournament_templates
  FOR SELECT TO anon USING (true);

CREATE POLICY "tournament_templates_all" ON tournament_templates
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 5. TOURNAMENT_NOTES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tournament_notes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  content       text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tournament_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournament_notes_select" ON tournament_notes
  FOR SELECT TO anon USING (true);

CREATE POLICY "tournament_notes_all" ON tournament_notes
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 6. BEST_PRACTICES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS best_practices (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  content       text,
  generated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE best_practices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "best_practices_select" ON best_practices
  FOR SELECT TO anon USING (true);

CREATE POLICY "best_practices_all" ON best_practices
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 7. TASK_EQUIPMENT (Verknüpfung Aufgabe ↔ Equipment)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_equipment (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  UNIQUE (task_id, equipment_id)
);

ALTER TABLE task_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_equipment_select" ON task_equipment
  FOR SELECT TO anon USING (true);

CREATE POLICY "task_equipment_all" ON task_equipment
  FOR ALL TO anon USING (true) WITH CHECK (true);
