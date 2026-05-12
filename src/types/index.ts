export type Role = 'VISITOR' | 'MEMBER' | 'ADMIN'
export type EquipmentStatus = 'OK' | 'DEFECT' | 'IN_REPAIR'
export type Sport =
  | 'Rallye Obedience'
  | 'Obedience'
  | 'THS'
  | 'Hoopers'
  | 'Treibball'
  | 'allg. Turnierzubehör'

export const SPORTS: Sport[] = [
  'Rallye Obedience',
  'Obedience',
  'THS',
  'Hoopers',
  'Treibball',
  'allg. Turnierzubehör',
]

export interface User {
  id: string
  username: string
  role: Role
  created_at: string
  push_subscription: string | null
}

export interface Room {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Cabinet {
  id: string
  name: string
  room_id: string
  created_at: string
  updated_at: string
}

export interface Equipment {
  id: string
  name: string
  count: number
  room_id: string
  cabinet_id: string | null
  sport: Sport | null
  description: string | null
  status: EquipmentStatus
  defect_note: string | null
  updated_at: string
}

export interface ChangeLog {
  id: string
  equipment_id: string
  user_id: string
  field: string
  old_value: string | null
  new_value: string | null
  changed_at: string
  equipment?: { name: string }
  user?: { username: string }
}
