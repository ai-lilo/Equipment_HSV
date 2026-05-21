-- Performance indexes for foreign key columns
-- Run this in the Supabase Dashboard > SQL Editor

CREATE INDEX IF NOT EXISTS idx_cabinets_room_id ON cabinets(room_id);

CREATE INDEX IF NOT EXISTS idx_equipment_room_id ON equipment(room_id);
CREATE INDEX IF NOT EXISTS idx_equipment_cabinet_id ON equipment(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category_id ON equipment(category_id);

CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);

CREATE INDEX IF NOT EXISTS idx_tournament_categories_tournament_id ON tournament_categories(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_helpers_tournament_id ON tournament_helpers(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_helper_availability_tournament_id ON tournament_helper_availability(tournament_id);

CREATE INDEX IF NOT EXISTS idx_change_log_equipment_id ON change_log(equipment_id);
