export type Role = 'VISITOR' | 'MEMBER' | 'ADMIN'
export type EquipmentStatus = 'OK' | 'DEFECT' | 'IN_REPAIR'

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface ShoppingListItem {
  id: string
  equipment_id: string | null
  note: string | null
  added_by: string
  status: 'open' | 'bought'
  created_at: string
  updated_at: string
  equipment?: { name: string; description: string | null; count: number }
  user?: { username: string }
}

export interface User {
  id: string
  username: string
  email: string | null
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
  is_consumable: boolean
  description: string | null
  status: EquipmentStatus
  defect_note: string | null
  photo_url: string | null
  updated_at: string
}

export type InstructionMediaType = 'image' | 'video'

export interface InstructionStep {
  id: string
  instruction_id: string
  order_index: number
  description: string
  media_url: string | null
  media_type: InstructionMediaType | null
  created_at: string
}

export interface Instruction {
  id: string
  equipment_id: string | null
  title: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  equipment?: { name: string }
  steps?: InstructionStep[]
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
