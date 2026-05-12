import { useState } from 'react'
import { ChevronDown, ChevronRight, DoorOpen, ArchiveX, Package } from 'lucide-react'
import EquipmentCard from './EquipmentCard'
import type { Room, Cabinet, Equipment, User } from '../../types'

interface Props {
  rooms: Room[]
  cabinets: Cabinet[]
  equipment: Equipment[]
  user: User
  searchQuery: string
  filterRoom: string
  filterSport: string
  hideEmpty: boolean
  onEditEquipment: (item: Equipment) => void
}

function matches(item: Equipment, q: string) {
  const lower = q.toLowerCase()
  return (
    item.name.toLowerCase().includes(lower) ||
    (item.sport?.toLowerCase().includes(lower) ?? false) ||
    (item.description?.toLowerCase().includes(lower) ?? false)
  )
}

export default function TreeView({
  rooms, cabinets, equipment, user, searchQuery, filterRoom, filterSport, hideEmpty, onEditEquipment,
}: Props) {
  const canEdit = user.role === 'MEMBER' || user.role === 'ADMIN'

  const filtered = equipment.filter(e => {
    if (searchQuery && !matches(e, searchQuery)) return false
    if (filterRoom && e.room_id !== filterRoom) return false
    if (filterSport && e.sport !== filterSport) return false
    return true
  })

  const filteredRooms = filterRoom ? rooms.filter(r => r.id === filterRoom) : rooms

  return (
    <div className="space-y-3">
      {filteredRooms.map(room => (
        <RoomNode
          key={room.id}
          room={room}
          cabinets={cabinets.filter(c => c.room_id === room.id)}
          equipment={filtered}
          canEdit={canEdit}
          hideEmpty={hideEmpty}
          onEditEquipment={onEditEquipment}
        />
      ))}
      {filteredRooms.length === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500 py-8">Keine Räume vorhanden.</p>
      )}
    </div>
  )
}

function RoomNode({ room, cabinets, equipment, canEdit, hideEmpty, onEditEquipment }: {
  room: Room
  cabinets: Cabinet[]
  equipment: Equipment[]
  canEdit: boolean
  hideEmpty: boolean
  onEditEquipment: (item: Equipment) => void
}) {
  const [open, setOpen] = useState(true)
  const directItems = equipment.filter(e => e.room_id === room.id && !e.cabinet_id)
  const cabinetItems = (cab: Cabinet) => equipment.filter(e => e.cabinet_id === cab.id)

  const totalInRoom = equipment.filter(e => e.room_id === room.id).length
  if (hideEmpty && totalInRoom === 0) return null

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        <DoorOpen size={18} className="text-green-600 dark:text-green-400" />
        <span className="font-semibold text-gray-900 dark:text-white">{room.name}</span>
        <span className="ml-auto text-xs text-gray-400">{totalInRoom} Artikel</span>
      </button>

      {open && (
        <div className="px-3 py-2 space-y-2 bg-white dark:bg-gray-850">
          {directItems.map(item => (
            <EquipmentCard key={item.id} item={item} canEdit={canEdit} onEdit={onEditEquipment} />
          ))}

          {cabinets.map(cab => {
            const items = cabinetItems(cab)
            if (hideEmpty && items.length === 0) return null
            return (
              <CabinetNode key={cab.id} cabinet={cab} items={items} canEdit={canEdit} onEditEquipment={onEditEquipment} />
            )
          })}

          {totalInRoom === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-2 flex items-center gap-2">
              <Package size={14} /> Kein Equipment
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function CabinetNode({ cabinet, items, canEdit, onEditEquipment }: {
  cabinet: Cabinet
  items: Equipment[]
  canEdit: boolean
  onEditEquipment: (item: Equipment) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden ml-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors text-left"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <ArchiveX size={16} className="text-blue-500" />
        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{cabinet.name}</span>
        <span className="ml-auto text-xs text-gray-400">{items.length}</span>
      </button>

      {open && (
        <div className="px-2 py-1.5 space-y-1.5 bg-white dark:bg-gray-800">
          {items.map(item => (
            <EquipmentCard key={item.id} item={item} canEdit={canEdit} onEdit={onEditEquipment} />
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-400 py-1 px-1">Leer</p>
          )}
        </div>
      )}
    </div>
  )
}
