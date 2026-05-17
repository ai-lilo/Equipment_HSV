-- Migration 003: Vorlage-Wiederherstellung und Checklisten-Flag

-- Vorherige Vorlage speichern (ermöglicht Wiederherstellung nach versehentlichem Ersetzen)
ALTER TABLE tournament_templates
  ADD COLUMN IF NOT EXISTS previous_source_tournament_id uuid REFERENCES tournaments(id);

-- Checklisten-Flag für Kategorien (ersetzt hardcodierten Namensfilter)
ALTER TABLE tournament_categories
  ADD COLUMN IF NOT EXISTS is_checklist boolean NOT NULL DEFAULT false;

-- Bestehende Checklisten-Kategorien aus dem Rally-Obedience-Template markieren
UPDATE tournament_categories
SET is_checklist = true
WHERE LOWER(name) SIMILAR TO '%(aufbau: platz|aufbau: parcours|aufbau: vorbereitungsraum|meldebüro: am veranstaltungstag|küche: turniertag)%';
