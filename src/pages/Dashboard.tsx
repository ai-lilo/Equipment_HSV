import { useState } from 'react'
import { Search, Plus, EyeOff, Eye, Filter, FileDown } from 'lucide-react'
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
  const [hideEmpty, setHideEmpty] = useState(false)
  const [editItem, setEditItem] = useState<Equipment | null | 'new'>(null)

  const canEdit = user.role === 'MEMBER' || user.role === 'ADMIN'

  async function handleAddToShoppingList(item: Equipment) {
    await supabase.from('shopping_list').insert({
      equipment_id: item.id,
      added_by: user.id,
      status: 'open',
      updated_at: new Date().toISOString(),
    })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {!loading && (
        <StatusOverview
          equipment={equipment}
          rooms={rooms}
          cabinets={cabinets}
          onEditEquipment={canEdit ? setEditItem : () => {}}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suche nach Equipment, Raum, Kategorie…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={filterRoom}
            onChange={e => setFilterRoom(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Alle Räume</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Alle Kategorien</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <button
            onClick={() => setHideEmpty(h => !h)}
            title={hideEmpty ? 'Leere Räume anzeigen' : 'Leere Räume ausblenden'}
            className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-700 transition-colors"
          >
            {hideEmpty ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>

          {(filterRoom || filterCategory || search) && (
            <button
              onClick={() => { setFilterRoom(''); setFilterCategory(''); setSearch('') }}
              className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-red-600 transition-colors"
              title="Filter zurücksetzen"
            >
              <Filter size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {canEdit && (
          <button
            onClick={() => setEditItem('new')}
            className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Equipment hinzufügen
          </button>
        )}
        {!loading && (
          <button
            onClick={() => exportInventoryPDF(rooms, cabinets, equipment, categories)}
            className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            title="Inventarliste als PDF exportieren"
          >
            <FileDown size={18} />
            <span className="hidden sm:inline">PDF exportieren</span>
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
          hideEmpty={hideEmpty}
          onEditEquipment={setEditItem}
          onAddToShoppingList={canEdit ? handleAddToShoppingList : undefined}
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
