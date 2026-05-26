import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Equipment } from '../../types'
import { Search, X, Package } from 'lucide-react'

interface Props {
  taskId: string
  readOnly: boolean
  onNavigateEquipment?: () => void
  allEquipment?: Equipment[]
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

export default function EquipmentLinker({ taskId, readOnly, allEquipment: allEquipmentProp }: Props) {
  const [links, setLinks] = useState<Link[]>([])
  const [allEquipmentLocal, setAllEquipmentLocal] = useState<Equipment[]>([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const allEquipment = allEquipmentProp ?? allEquipmentLocal

  useEffect(() => {
    loadLinks()
    if (!readOnly && !allEquipmentProp) loadEquipment()
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
    setAllEquipmentLocal((data ?? []) as Equipment[])
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
      {(links.length > 0 || !readOnly) && (
        <div className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1.5">
          Benötigtes Inventar
        </div>
      )}
      <div className="space-y-1">
        {links.map(link => {
          const loc = locationText(link.equipment)
          return (
            <div key={link.id} className="flex items-center gap-2 text-sm bg-cream-100 border border-navy-200 rounded-lg px-2 py-1.5">
              <div className="flex-1 min-w-0">
                <span className="text-navy-700 font-medium">
                  {link.equipment?.name ?? '—'}
                </span>
                {loc && (
                  <span className="ml-2 text-xs text-gray-500 inline-flex items-center gap-0.5">
                    <Package size={10} /> {loc}
                  </span>
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
        <div className="mt-1.5">
          {showSearch ? (
            <div className="relative">
              <div className="flex items-center gap-1 bg-cream-100 rounded-xl px-3 py-2">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Inventar suchen..."
                  className="flex-1 text-sm bg-transparent outline-none text-gray-900"
                />
                <button onClick={() => { setShowSearch(false); setSearch('') }} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              </div>
              {search && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">Keine Ergebnisse</div>
                  ) : (
                    filtered.map(e => (
                      <button
                        key={e.id}
                        onClick={() => addLink(e.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-cream-100 text-gray-900"
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
              className="text-xs text-navy-700 hover:underline flex items-center gap-1 mt-1"
            >
              + Inventar verknüpfen
            </button>
          )}
        </div>
      )}
    </div>
  )
}
