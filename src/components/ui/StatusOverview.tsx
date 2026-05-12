import { useState } from 'react'
import { AlertCircle, Wrench, ChevronDown, ChevronRight } from 'lucide-react'
import type { Equipment, Room, Cabinet } from '../../types'

interface Props {
  equipment: Equipment[]
  rooms: Room[]
  cabinets: Cabinet[]
  onEditEquipment: (item: Equipment) => void
}

export default function StatusOverview({ equipment, rooms, cabinets, onEditEquipment }: Props) {
  const defect = equipment.filter(e => e.status === 'DEFECT')
  const inRepair = equipment.filter(e => e.status === 'IN_REPAIR')

  if (defect.length === 0 && inRepair.length === 0) return null

  function locationLabel(item: Equipment) {
    const room = rooms.find(r => r.id === item.room_id)
    const cabinet = item.cabinet_id ? cabinets.find(c => c.id === item.cabinet_id) : null
    return cabinet ? `${room?.name} › ${cabinet.name}` : (room?.name ?? '—')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {defect.length > 0 && (
        <StatusCard
          icon={<AlertCircle size={16} className="text-red-500" />}
          label="Defekt"
          count={defect.length}
          items={defect}
          locationLabel={locationLabel}
          onEdit={onEditEquipment}
          borderCls="border-red-200 dark:border-red-800"
          countCls="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        />
      )}
      {inRepair.length > 0 && (
        <StatusCard
          icon={<Wrench size={16} className="text-yellow-500" />}
          label="In Reparatur"
          count={inRepair.length}
          items={inRepair}
          locationLabel={locationLabel}
          onEdit={onEditEquipment}
          borderCls="border-yellow-200 dark:border-yellow-800"
          countCls="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
        />
      )}
    </div>
  )
}

function StatusCard({ icon, label, count, items, locationLabel, onEdit, borderCls, countCls }: {
  icon: React.ReactNode
  label: string
  count: number
  items: Equipment[]
  locationLabel: (item: Equipment) => string
  onEdit: (item: Equipment) => void
  borderCls: string
  countCls: string
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className={`flex-1 border rounded-xl overflow-hidden ${borderCls} bg-white dark:bg-gray-800`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
      >
        {icon}
        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{label}</span>
        <span className={`ml-1 text-xs font-bold px-2 py-0.5 rounded-full ${countCls}`}>{count}</span>
        <span className="ml-auto text-gray-400">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>
      {open && (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onEdit(item)}
              className="w-full flex items-start gap-2 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-400 truncate">{locationLabel(item)}</p>
                {item.defect_note && (
                  <p className="text-xs text-red-500 dark:text-red-400 truncate">{item.defect_note}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
