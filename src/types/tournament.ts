export type TaskStatus = 'nicht_begonnen' | 'in_arbeit' | 'abgeschlossen'

export interface Tournament {
  id: string
  name: string
  date: string
  template_type: string | null
  archived: boolean
  is_template: boolean
  created_by: string | null
  created_at: string
}

export interface TournamentCategory {
  id: string
  tournament_id: string
  name: string
  sort_order: number
  is_checklist: boolean
}

export interface TournamentTask {
  id: string
  category_id: string
  title: string
  status: TaskStatus
  responsible_user_id: string | null
  due_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface TournamentTemplate {
  id: string
  name: string
  source_tournament_id: string | null
  previous_source_tournament_id: string | null
}

export interface TournamentNote {
  id: string
  tournament_id: string
  content: string | null
  updated_at: string
}

export interface BestPractice {
  id: string
  tournament_id: string
  content: string | null
  generated_at: string
}

export interface TaskEquipmentLink {
  id: string
  task_id: string
  equipment_id: string
}

export interface ClubMember {
  id: string
  name: string
  active: boolean
  created_at: string
}

export interface TournamentHelper {
  id: string
  tournament_id: string
  member_id: string | null
  member?: { id: string; name: string } | null
  role: string | null
  time_start: string | null
  time_end: string | null
  sort_order: number
  created_at: string
}
