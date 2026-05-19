import { useState } from 'react'
import { ChevronDown, ChevronRight, Home, ArchiveX, Package } from 'lucide-react'
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
    <div className="space-y-4">
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
        <p className="text-center text-gray-400 py-8">Keine Räume vorhanden.</p>
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
  const totalCount = equipment.filter(e => e.room_id === room.id).reduce((s, e) => s + e.count, 0)
  if (hideEmpty && totalInRoom === 0) return null

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 py-3 text-left"
      >
        {open
          ? <ChevronDown size={18} className="text-gray-400 shrink-0" />
          : <ChevronRight size={18} className="text-gray-400 shrink-0" />
        }
        <span className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center shrink-0">
          <Home size={15} className="text-navy-700" />
        </span>
        <span className="font-bold text-xl text-navy-900">{room.name}</span>
        <span className="ml-auto text-sm text-gray-400 shrink-0">
          {cabinets.length} Schränke · {totalCount} Stk.
        </span>
      </button>

      {open && (
        <div className="space-y-3">
          {directItems.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {directItems.map(item => (
                <EquipmentCard
                  key={item.id} item={item} canEdit={canEdit} categories={categories}
                  openShoppingIds={openShoppingIds}
                  onEdit={onEditEquipment} onAddToShoppingList={onAddToShoppingList}
                />
              ))}
            </div>
          )}

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
            <p className="text-sm text-gray-400 py-2 flex items-center gap-2">
              <Package size={14} /> Kein Inventar
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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        {open
          ? <ChevronDown size={16} className="text-gray-400 shrink-0" />
          : <ChevronRight size={16} className="text-gray-400 shrink-0" />
        }
        <ArchiveX size={16} className="text-navy-600 shrink-0" />
        <span className="font-semibold text-sm text-gray-800">{cabinet.name}</span>
        <span className="ml-auto w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center shrink-0">
          {items.length}
        </span>
      </button>

      {open && (
        <div className="p-3">
          {items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {items.map(item => (
                <EquipmentCard
                  key={item.id} item={item} canEdit={canEdit} categories={categories}
                  openShoppingIds={openShoppingIds}
                  onEdit={onEditEquipment} onAddToShoppingList={onAddToShoppingList}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-1 px-1">Leer</p>
          )}
        </div>
      )}
    </div>
  )
}
