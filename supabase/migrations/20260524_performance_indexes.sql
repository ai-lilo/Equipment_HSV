-- Performance indexes for frequently joined/filtered foreign key columns

CREATE INDEX IF NOT EXISTS idx_tasks_responsible_user
  ON tasks(responsible_user_id);

CREATE INDEX IF NOT EXISTS idx_tournament_helpers_member
  ON tournament_helpers(member_id);

CREATE INDEX IF NOT EXISTS idx_task_equipment_task
  ON task_equipment(task_id);

CREATE INDEX IF NOT EXISTS idx_task_equipment_equipment
  ON task_equipment(equipment_id);

CREATE INDEX IF NOT EXISTS idx_shopping_list_equipment
  ON shopping_list(equipment_id);

CREATE INDEX IF NOT EXISTS idx_helper_availability_member
  ON tournament_helper_availability(member_id);
