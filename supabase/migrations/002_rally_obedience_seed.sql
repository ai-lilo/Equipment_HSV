-- ============================================================
-- Rally Obedience Vorlage – Seed-Skript
-- Migration 002: Vorlage-Turnier + Kategorien + Aufgaben
-- Ausführen NACH 001_tournament_tables.sql
-- ============================================================

DO $$
DECLARE
  t_id  uuid := gen_random_uuid();

  c_pl_voraus    uuid := gen_random_uuid();
  c_aufbau_platz uuid := gen_random_uuid();
  c_aufbau_parc  uuid := gen_random_uuid();
  c_aufbau_vorb  uuid := gen_random_uuid();
  c_equip        uuid := gen_random_uuid();
  c_melde_vorb   uuid := gen_random_uuid();
  c_melde_tag    uuid := gen_random_uuid();
  c_kueche_vorb  uuid := gen_random_uuid();
  c_kueche_tag   uuid := gen_random_uuid();
  c_kueche_nach  uuid := gen_random_uuid();
  c_sonst        uuid := gen_random_uuid();

BEGIN

-- ------------------------------------------------------------
-- Vorlage-Turnier
-- ------------------------------------------------------------
INSERT INTO tournaments (id, name, date, template_type, archived, is_template)
VALUES (
  t_id,
  'Vorlage: Rally Obedience',
  '2000-01-01',
  'rally_obedience',
  false,
  true
);

-- ------------------------------------------------------------
-- Kategorien (sort_order in 10er-Schritten)
-- ------------------------------------------------------------
INSERT INTO tournament_categories (id, tournament_id, name, sort_order) VALUES
  (c_pl_voraus,    t_id, 'Prüfungsleiter: Im Voraus',           10),
  (c_aufbau_platz, t_id, 'Aufbau: Platz',                       20),
  (c_aufbau_parc,  t_id, 'Aufbau: Parcours',                    30),
  (c_aufbau_vorb,  t_id, 'Aufbau: Vorbereitungsraum',           40),
  (c_equip,        t_id, 'Equipmentkontrolle',                  50),
  (c_melde_vorb,   t_id, 'Meldebüro: Vorbereitungen',           60),
  (c_melde_tag,    t_id, 'Meldebüro: Am Veranstaltungstag',     70),
  (c_kueche_vorb,  t_id, 'Küche: Vorbereitungen',               80),
  (c_kueche_tag,   t_id, 'Küche: Turniertag',                   90),
  (c_kueche_nach,  t_id, 'Küche: Nach dem Turnier',            100),
  (c_sonst,        t_id, 'Sonstiges',                          110);

-- ------------------------------------------------------------
-- Aufgaben: Prüfungsleiter – Im Voraus
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_pl_voraus, 'Terminschutz beantragen', 'nicht_begonnen'),
  (c_pl_voraus, 'Prüfungsleiter festlegen', 'nicht_begonnen'),
  (c_pl_voraus, 'Evtl. Turniersoftware kaufen', 'nicht_begonnen'),
  (c_pl_voraus, 'Schützen: Termin abklären wegen Schießen', 'nicht_begonnen'),
  (c_pl_voraus, 'Schützenhaus: Termin abklären wegen Essen / WC', 'nicht_begonnen'),
  (c_pl_voraus, 'Turnierausschreibung erstellen und veröffentlichen, auf Homepage stellen und evtl. Hundesportkalender O.M.A.', 'nicht_begonnen'),
  (c_pl_voraus, 'Stationsnummern 1–24 kontrollieren', 'nicht_begonnen'),
  (c_pl_voraus, 'Startnummern 1–60 kontrollieren', 'nicht_begonnen'),
  (c_pl_voraus, 'Rally Obedience Turniersoftware aktualisieren (Update)', 'nicht_begonnen'),
  (c_pl_voraus, 'Turnierzubehör (nach PO RO) kontrollieren', 'nicht_begonnen'),
  (c_pl_voraus, 'Teilnehmerschleifen bestellen (Hartl-hippoversand)', 'nicht_begonnen'),
  (c_pl_voraus, 'Urkunden: 50 Blatt Marmorpapier 90 g/m²', 'nicht_begonnen'),
  (c_pl_voraus, 'Je nach Ausführung der Schleifen: runde Etiketten bestellen (Herma, weiß, rund) und kleine Klebepunkte für Formwertnoten (rot, blau usw.)', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Aufgaben: Aufbau – Platz
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_aufbau_platz, 'Richterzelt aufbauen', 'nicht_begonnen'),
  (c_aufbau_platz, 'Mikrofon / Lautsprecher aufbauen', 'nicht_begonnen'),
  (c_aufbau_platz, '2 Stoppuhren bereitstellen', 'nicht_begonnen'),
  (c_aufbau_platz, '1 Klemmbrett bereitstellen', 'nicht_begonnen'),
  (c_aufbau_platz, '2 Stifte bereitstellen', 'nicht_begonnen'),
  (c_aufbau_platz, '1 Stuhl bereitstellen', 'nicht_begonnen'),
  (c_aufbau_platz, '1 Tisch bereitstellen', 'nicht_begonnen'),
  (c_aufbau_platz, 'Mülleimer und Aschenbecher aufbauen', 'nicht_begonnen'),
  (c_aufbau_platz, 'Hinweisschild Meldestelle anbringen', 'nicht_begonnen'),
  (c_aufbau_platz, 'Hundekotbeutel bereitstellen', 'nicht_begonnen'),
  (c_aufbau_platz, 'Sonnenschirme aufmachen, Markise ausfahren', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Aufgaben: Aufbau – Parcours
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_aufbau_parc, 'Stationsnummern 1–24 aufstellen', 'nicht_begonnen'),
  (c_aufbau_parc, '32 Schilderhalter aufstellen', 'nicht_begonnen'),
  (c_aufbau_parc, 'Zwei Hürden aufbauen (Breite 1,00–1,50 m)', 'nicht_begonnen'),
  (c_aufbau_parc, '4 Pylonen rot aufstellen', 'nicht_begonnen'),
  (c_aufbau_parc, '4 Futterschalen bereitstellen', 'nicht_begonnen'),
  (c_aufbau_parc, '4 Abdeckungen für Futterschalen bereitstellen', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Aufgaben: Aufbau – Vorbereitungsraum
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_aufbau_vorb, '5 Schilderhalter aufstellen', 'nicht_begonnen'),
  (c_aufbau_vorb, '1 Hürde aufbauen (Breite 1,00–1,50 m)', 'nicht_begonnen'),
  (c_aufbau_vorb, '4 Pylonen rot aufstellen', 'nicht_begonnen'),
  (c_aufbau_vorb, '4 Futterschalen bereitstellen', 'nicht_begonnen'),
  (c_aufbau_vorb, '4 Abdeckungen für Futterschalen bereitstellen', 'nicht_begonnen'),
  (c_aufbau_vorb, '1 Stuhl bereitstellen', 'nicht_begonnen'),
  (c_aufbau_vorb, '1 Klemmbrett mit Starterlisten und Stift bereitstellen', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Aufgaben: Equipmentkontrolle
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_equip, 'Mikrofon und Lautsprecher prüfen', 'nicht_begonnen'),
  (c_equip, 'Startnummern 1–60 prüfen', 'nicht_begonnen'),
  (c_equip, 'Stationsnummern 1–24 prüfen', 'nicht_begonnen'),
  (c_equip, '32 Schilderhalter prüfen', 'nicht_begonnen'),
  (c_equip, 'Drei baugleiche Hürden prüfen (Breite 1,00–1,50 m)', 'nicht_begonnen'),
  (c_equip, '14 Pylonen prüfen (25 cm hoch)', 'nicht_begonnen'),
  (c_equip, '8 Futterschalen prüfen', 'nicht_begonnen'),
  (c_equip, '8 Abdeckungen für Futterschalen prüfen', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Aufgaben: Meldebüro – Vorbereitungen
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_melde_vorb, 'Hängeregister vorbereiten (Startnummern einsortieren)', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Aufgaben: Meldebüro – Am Veranstaltungstag
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_melde_tag, 'Meldebüro einrichten (2 Tische, 2 Stühle, PC, Drucker, Patronen, Mehrfachsteckdosen, Druckerpapier, Etiketten für Turnierkarten, Kugelschreiber, Schere, Tesa, Bleistifte, Spitzer, Radiergummi, Handynummernliste)', 'nicht_begonnen'),
  (c_melde_tag, 'Vorläufige Starterliste 3× alphabetisch sortiert bereitlegen (für Halsbandkontrolle, Meldebüro, Containeraushang)', 'nicht_begonnen'),
  (c_melde_tag, 'Schleifen vorbereiten (runde Etiketten aufkleben, farbige Formwertnotenetiketten bereitlegen)', 'nicht_begonnen'),
  (c_melde_tag, 'Parcourspläne / Starterliste aufhängen', 'nicht_begonnen'),
  (c_melde_tag, 'Gemeldete Personen auf der Starterliste abhaken', 'nicht_begonnen'),
  (c_melde_tag, 'Barzahler kassieren', 'nicht_begonnen'),
  (c_melde_tag, 'Startnummer ausgeben', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Aufgaben: Küche – Vorbereitungen
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_kueche_vorb, 'Spendenaufrufe für Kuchen (Vereinsmitglieder) und belegte Brötchen', 'nicht_begonnen'),
  (c_kueche_vorb, '4 Kuchen organisieren', 'nicht_begonnen'),
  (c_kueche_vorb, '25 belegte Brötchen organisieren', 'nicht_begonnen'),
  (c_kueche_vorb, 'Getränke und haltbare Essenszutaten einkaufen (vorher kontrollieren was bereits da ist)', 'nicht_begonnen'),
  (c_kueche_vorb, '1 Kasten Spezi einkaufen', 'nicht_begonnen'),
  (c_kueche_vorb, '1 Kasten Schorlen einkaufen', 'nicht_begonnen'),
  (c_kueche_vorb, '1 Kasten Wasser einkaufen', 'nicht_begonnen'),
  (c_kueche_vorb, 'Milch einkaufen', 'nicht_begonnen'),
  (c_kueche_vorb, 'Hafermilch einkaufen', 'nicht_begonnen'),
  (c_kueche_vorb, 'Zucker einkaufen', 'nicht_begonnen'),
  (c_kueche_vorb, 'Kaffeepulver einkaufen', 'nicht_begonnen'),
  (c_kueche_vorb, 'Stilles Wasser zum Kaffeekochen einkaufen', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Aufgaben: Küche – Turniertag
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_kueche_tag, 'Kaffee kochen', 'nicht_begonnen'),
  (c_kueche_tag, 'Zucker und Milch bereitstellen', 'nicht_begonnen'),
  (c_kueche_tag, 'Teller, Tassen, Löffel bereitstellen', 'nicht_begonnen'),
  (c_kueche_tag, 'Tischdecken auflegen', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Aufgaben: Küche – Nach dem Turnier
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_kueche_nach, 'Teller und Tassen zum Spülen mit nach Hause nehmen', 'nicht_begonnen'),
  (c_kueche_nach, 'Kuchen- / Brötchenreste verteilen', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Aufgaben: Sonstiges
-- ------------------------------------------------------------
INSERT INTO tasks (category_id, title, status) VALUES
  (c_sonst, 'Genügend Wechselgeld bereitstellen', 'nicht_begonnen'),
  (c_sonst, 'Preislisten erstellen', 'nicht_begonnen'),
  (c_sonst, 'Geschenk für Richter besorgen (ca. 10 €)', 'nicht_begonnen'),
  (c_sonst, 'Geschenke besorgen: 15 große (ca. 2–3 € pro Stück) und 45 kleine (kostenlos)', 'nicht_begonnen'),
  (c_sonst, 'Müll nach dem Turnier entsorgen', 'nicht_begonnen'),
  (c_sonst, 'Abrechnung mit Gabi', 'nicht_begonnen');

-- ------------------------------------------------------------
-- Template-Eintrag
-- ------------------------------------------------------------
INSERT INTO tournament_templates (name, source_tournament_id)
VALUES ('Rally Obedience', t_id);

END $$;
