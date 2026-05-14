import { useState } from 'react'
import { ChevronDown, ChevronRight, DoorOpen, ArchiveX, Package } from 'lucide-react'
import EquipmentCard from './EquipmentCard'
import type { Room, Cabinet, Equipment, User, Category } from '../../types'

interface Props {
  rooms: Room[]
  cabinets: Cabinet[]
  equipment: Equipment[]
  categories: Category[]
  user: User
  searchQuery: string
  filterRoom: string
  filterCategory: string
  hideEmpty: boolean
  openShoppingIds: Set<string>
  onEditEquipment: (item: Equipment) => void
  onAddToShoppingList?: (item: Equipment) => Promise<'added' | 'duplicate'>
}

function matches(item: Equipment, q: string, categories: Category[]) {
  const lower = q.toLowerCase()
  const catName = categories.find(c => c.id === item.category_id)?.name ?? ''
  return (
    item.name.toLowerCase().includes(lower) ||
    catName.toLowerCase().includes(lower) ||
    (item.description?.toLowerCase().includes(lower) ?? false)
  )
}

export default function TreeView({
  rooms, cabinets, equipment, categories, user, searchQuery, filterRoom, filterCategory, hideEmpty,
  openShoppingIds, onEditEquipment, onAddToShoppingList,
}: Props) {
  const canEdit = user.role === 'MEMBER' || user.role === 'ADMIN'

  const filtered = equipment.filter(e => {
    if (searchQuery && !matches(e, searchQuery, categories)) return false
    if (filterRoom && e.room_id !== filterRoom) return false
    if (filterCategory && e.category_id !== filterCategory) return false
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
          categories={categories}
          canEdit={canEdit}
          hideEmpty={hideEmpty}
          openShoppingIds={openShoppingIds}
          onEditEquipment={onEditEquipment}
          onAddToShoppingList={onAddToShoppingList}
        />
      ))}
      {filteredRooms.length === 0 && (
        <p className="text-center text-gray-400 dark:text-gray-500 py-8">Keine Räume vorhanden.</p>
      )}
    </div>
  )
}

function RoomNode({ room, cabinets, equipment, categories, canEdit, hideEmpty, openShoppingIds, onEditEquipment, onAddToShoppingList }: {
  room: Room
  cabinets: Cabinet[]
  equipment: Equipment[]
  categories: Category[]
  canEdit: boolean
  hideEmpty: boolean
  openShoppingIds: Set<string>
  onEditEquipment: (item: Equipment) => void
  onAddToShoppingList?: (item: Equipment) => Promise<'added' | 'duplicate'>
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
        <DoorOpen size={18} className="text-blue-600 dark:text-blue-400" />
        <span className="font-semibold text-gray-900 dark:text-white">{room.name}</span>
        <span className="ml-auto text-xs text-gray-400">{totalInRoom} Artikel</span>
      </button>

      {open && (
        <div className="px-3 py-2 space-y-2 bg-white dark:bg-gray-850">
          {directItems.map(item => (
            <EquipmentCard
              key={item.id} item={item} canEdit={canEdit} categories={categories}
              openShoppingIds={openShoppingIds}
              onEdit={onEditEquipment} onAddToShoppingList={onAddToShoppingList}
            />
          ))}

          {cabinets.map(cab => {
            const items = cabinetItems(cab)
            if (hideEmpty && items.length === 0) return null
            return (
              <CabinetNode
                key={cab.id} cabinet={cab} items={items} categories={categories}
                canEdit={canEdit} openShoppingIds={openShoppingIds}
                onEditEquipment={onEditEquipment} onAddToShoppingList={onAddToShoppingList}
              />
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

function CabinetNode({ cabinet, items, categories, canEdit, openShoppingIds, onEditEquipment, onAddToShoppingList }: {
  cabinet: Cabinet
  items: Equipment[]
  categories: Category[]
  canEdit: boolean
  openShoppingIds: Set<string>
  onEditEquipment: (item: Equipment) => void
  onAddToShoppingList?: (item: Equipment) => Promise<'added' | 'duplicate'>
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
            <EquipmentCard
              key={item.id} item={item} canEdit={canEdit} categories={categories}
              openShoppingIds={openShoppingIds}
              onEdit={onEditEquipment} onAddToShoppingList={onAddToShoppingList}
            />
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-400 py-1 px-1">Leer</p>
          )}
        </div>
      )}
    </div>
  )
}
