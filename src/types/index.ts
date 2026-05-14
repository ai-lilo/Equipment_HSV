export type Role = 'VISITOR' | 'MEMBER' | 'ADMIN'
export type EquipmentStatus = 'OK' | 'DEFECT' | 'IN_REPAIR'

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface ShoppingListItem {
  id: string
  equipment_id: string
  added_by: string
  status: 'open' | 'bought'
  created_at: string
  updated_at: string
  equipment?: { name: string; description: string | null }
  user?: { username: string }
}

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
  sport: string | null
  category_id: string | null
  description: string | null
  status: EquipmentStatus
  defect_note: string | null
  photo_url: string | null
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
