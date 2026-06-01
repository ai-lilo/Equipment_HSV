import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, FileDown } from 'lucide-react'
import TreeView from '../components/tree/TreeView'
import EquipmentForm from '../components/equipment/EquipmentForm'
import StatusOverview from '../components/ui/StatusOverview'
import { useInventory } from '../hooks/useInventory'
import { useCategories } from '../hooks/useCategories'
import { exportInventoryPDF } from '../lib/pdf'
import { supabase } from '../lib/supabase'
import type { User, Equipment } from '../types'

interface Props {
  user: User
  filterRoom?: string
  filterCabinet?: string
}

export default function Dashboard({ user, filterRoom: initRoom, filterCabinet: initCabinet }: Props) {
  const { rooms, cabinets, equipment, loading, reload } = useInventory()
  const { categories } = useCategories()
  const [search, setSearch] = useState('')
  const [filterRoom, setFilterRoom] = useState(initRoom ?? '')
  const [filterCategory, setFilterCategory] = useState('')
  const [editItem, setEditItem] = useState<Equipment | null | 'new'>(null)
  const [openShoppingIds, setOpenShoppingIds] = useState<Set<string>>(new Set())
  const [instructionCounts, setInstructionCounts] = useState<Map<string, number>>(new Map())

  const canEdit = user.role === 'MEMBER' || user.role === 'ADMIN'

  const loadShoppingIds = useCallback(async () => {
    const { data } = await supabase
      .from('shopping_list')
      .select('equipment_id')
      .eq('status', 'open')
    setOpenShoppingIds(new Set((data ?? []).map((r: { equipment_id: string }) => r.equipment_id)))
  }, [])

  useEffect(() => { loadShoppingIds() }, [loadShoppingIds])

  useEffect(() => {
    supabase.from('instructions').select('equipment_id').not('equipment_id', 'is', null).then(({ data }) => {
      const counts = new Map<string, number>()
      for (const row of (data ?? []) as { equipment_id: string }[]) {
        counts.set(row.equipment_id, (counts.get(row.equipment_id) ?? 0) + 1)
      }
      setInstructionCounts(counts)
    })
  }, [])

  async function handleAddToShoppingList(item: Equipment): Promise<'added' | 'duplicate'> {
    if (openShoppingIds.has(item.id)) return 'duplicate'
    await supabase.from('shopping_list').insert({
      equipment_id: item.id,
      added_by: user.id,
      status: 'open',
      updated_at: new Date().toISOString(),
    })
    setOpenShoppingIds(prev => new Set([...prev, item.id]))
    return 'added'
  }

  const totalCount = equipment.length

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-10">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1">Vereins-Inventar</p>
        <h1 className="text-3xl font-bold text-navy-900" style={{ fontFamily: "'Lora', serif" }}>
          Inventar <em>überblicken</em>
        </h1>
        {!loading && (
          <p className="text-sm text-gray-400 mt-2">
            {rooms.length} Räume · {cabinets.length} Schränke · {totalCount} Geräte
          </p>
        )}
      </div>

      {!loading && (
        <StatusOverview equipment={equipment} />
      )}

      <div className="relative mb-3">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Inventar suchen ..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border-0 shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-700"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <select
          value={filterRoom}
          onChange={e => setFilterRoom(e.target.value)}
          className="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
        >
          <option value="">Alle Räume</option>
          {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-2.5 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
        >
          <option value="">Alle Kategorien</option>
          {categories.filter(c => c.name !== 'Verbrauchsmaterial').map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 mb-6">
        {canEdit && (
          <button
            onClick={() => setEditItem('new')}
            className="flex-1 flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 text-white py-3 rounded-xl font-semibold transition-colors"
          >
            <Plus size={18} />
            Inventar hinzufügen
          </button>
        )}
        {!loading && (
          <button
            onClick={() => exportInventoryPDF(rooms, cabinets, equipment, categories)}
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 py-3 rounded-xl font-medium transition-colors"
            title="Inventarliste als PDF exportieren"
          >
            <FileDown size={18} />
            PDF
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Lade Daten…</p>
      ) : (
        <TreeView
          rooms={rooms}
          cabinets={cabinets}
          equipment={equipment}
          categories={categories}
          user={user}
          searchQuery={search}
          filterRoom={filterRoom}
          filterCategory={filterCategory}
          hideEmpty={!!(filterCategory || filterRoom || search)}
          openShoppingIds={openShoppingIds}
          onEditEquipment={setEditItem}
          onAddToShoppingList={canEdit ? handleAddToShoppingList : undefined}
          instructionCounts={instructionCounts}
        />
      )}

      {editItem !== null && (
        <EquipmentForm
          item={editItem === 'new' ? null : editItem}
          rooms={rooms}
          cabinets={cabinets}
          user={user}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); reload() }}
          initCabinetId={initCabinet}
        />
      )}
    </div>
  )
}
