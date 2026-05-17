import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Equipment } from '../../types'
import { Search, X } from 'lucide-react'

interface Props {
  taskId: string
  readOnly: boolean
  onNavigateEquipment?: () => void
}

interface EquipmentWithLocation extends Equipment {
  room?: { name: string } | null
  cabinet?: { name: string } | null
}

interface Link {
  id: string
  equipment_id: string
  equipment: EquipmentWithLocation
}

export default function EquipmentLinker({ taskId, readOnly }: Props) {
  const [links, setLinks] = useState<Link[]>([])
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    loadLinks()
    if (!readOnly) loadEquipment()
  }, [taskId])

  async function loadLinks() {
    const { data } = await supabase
      .from('task_equipment')
      .select('id, equipment_id, equipment:equipment_id(*, room:room_id(name), cabinet:cabinet_id(name))')
      .eq('task_id', taskId)
    setLinks((data ?? []) as unknown as Link[])
  }

  async function loadEquipment() {
    const { data } = await supabase.from('equipment').select('*').order('name')
    setAllEquipment((data ?? []) as Equipment[])
  }

  async function addLink(equipmentId: string) {
    await supabase.from('task_equipment').insert({ task_id: taskId, equipment_id: equipmentId })
    setSearch('')
    setShowSearch(false)
    await loadLinks()
  }

  async function removeLink(linkId: string) {
    await supabase.from('task_equipment').delete().eq('id', linkId)
    setLinks(prev => prev.filter(l => l.id !== linkId))
  }

  const linkedIds = new Set(links.map(l => l.equipment_id))
  const filtered = allEquipment.filter(e =>
    !linkedIds.has(e.id) &&
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  if (links.length === 0 && readOnly) return null

  function locationText(eq: EquipmentWithLocation): string {
    if (!eq.room?.name) return ''
    return eq.cabinet?.name ? `${eq.room.name} / ${eq.cabinet.name}` : eq.room.name
  }

  return (
    <div className="mt-2">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
        Benötigtes Equipment
      </div>
      <div className="space-y-1">
        {links.map(link => {
          const loc = locationText(link.equipment)
          return (
            <div key={link.id} className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1">
              <div className="flex-1 min-w-0">
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  {link.equipment?.name ?? '—'}
                </span>
                {loc && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">📦 {loc}</span>
                )}
              </div>
              {!readOnly && (
                <button onClick={() => removeLink(link.id)} className="text-red-400 hover:text-red-600 shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <div className="mt-1">
          {showSearch ? (
            <div className="relative">
              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Equipment suchen..."
                  className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white"
                />
                <button onClick={() => { setShowSearch(false); setSearch('') }} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
              {search && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">Keine Ergebnisse</div>
                  ) : (
                    filtered.map(e => (
                      <button
                        key={e.id}
                        onClick={() => addLink(e.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-white"
                      >
                        {e.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
            >
              + Equipment verknüpfen
            </button>
          )}
        </div>
      )}
    </div>
  )
}
