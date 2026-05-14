-- ============================================================
-- Migration: Verbrauchsmaterial als Boolean-Feld
-- Im Supabase SQL Editor ausführen
-- ============================================================

-- 1. Neues Feld is_consumable
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS is_consumable BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Bestehende Verbrauchsmaterial-Einträge migrieren
UPDATE equipment
SET is_consumable = TRUE, category_id = NULL
WHERE category_id = (SELECT id FROM categories WHERE name = 'Verbrauchsmaterial');

-- Die Kategorie "Verbrauchsmaterial" bleibt in der DB erhalten.
-- Admin kann sie über Admin → Kategorien manuell löschen.
