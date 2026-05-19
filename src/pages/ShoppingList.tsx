import { useState, useEffect, useCallback } from 'react'
import { Check, Plus, ShoppingCart } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { User, ShoppingListItem } from '../types'

interface Props {
  user: User
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'heute'
  if (days === 1) return 'gestern'
  if (days < 7) return `vor ${days} Tagen`
  const weeks = Math.floor(days / 7)
  return `vor ${weeks} Woche${weeks > 1 ? 'n' : ''}`
}

export default function ShoppingList({ user }: Props) {
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('shopping_list')
      .select('*, equipment:equipment_id(name, description, count), user:added_by(username)')
      .order('created_at', { ascending: false })
    setItems((data ?? []) as ShoppingListItem[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    const text = newNote.trim()
    if (!text) return
    setAdding(true)
    const { data } = await supabase
      .from('shopping_list')
      .insert({
        equipment_id: null,
        note: text,
        added_by: user.id,
        status: 'open',
        updated_at: new Date().toISOString(),
      })
      .select('*, equipment:equipment_id(name, description, count), user:added_by(username)')
      .single()
    if (data) setItems(prev => [data as ShoppingListItem, ...prev])
    setNewNote('')
    setAdding(false)
  }

  async function markBought(id: string) {
    await supabase
      .from('shopping_list')
      .update({ status: 'bought', updated_at: new Date().toISOString() })
      .eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'bought' as const } : i))
  }

  async function markOpen(id: string) {
    await supabase
      .from('shopping_list')
      .update({ status: 'open', updated_at: new Date().toISOString() })
      .eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'open' as const } : i))
  }

  async function deleteItem(id: string) {
    await supabase.from('shopping_list').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const openItems = items.filter(i => i.status === 'open')
  const boughtItems = items.filter(i => i.status === 'bought')

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      {/* Hero */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1">Vorstand &amp; Admin</p>
        <h1 className="text-3xl font-bold text-navy-900" style={{ fontFamily: "'Lora', serif" }}>
          Einkaufs<em>liste</em>
        </h1>
        {!loading && (
          <p className="text-sm text-gray-400 mt-2">
            {openItems.length} offene Artikel · {boughtItems.length} erledigt
          </p>
        )}
      </div>

      {/* Quick-Add */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Plus size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Artikel notieren …"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-0 shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-700"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || !newNote.trim()}
          className="px-5 py-3 bg-navy-700 hover:bg-navy-800 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
        >
          Hinzufügen
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-400 py-12">Lade…</p>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <p>Die Einkaufsliste ist leer.</p>
          <p className="text-sm mt-1">Verbrauchsmaterial über den Warenkorb im Inventar hinzufügen.</p>
        </div>
      ) : (
        <>
          {openItems.length > 0 && (
            <div className="space-y-2 mb-6">
              {openItems.map(item => (
                <ShoppingRow
                  key={item.id}
                  item={item}
                  onToggle={() => markBought(item.id)}
                  onDelete={() => deleteItem(item.id)}
                  canDelete={user.role === 'ADMIN' || item.added_by === user.id}
                />
              ))}
            </div>
          )}

          {boughtItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-sm font-semibold text-gray-500">Erledigt</span>
                <span className="w-6 h-6 rounded-full bg-gray-200 text-xs font-bold text-gray-500 flex items-center justify-center">
                  {boughtItems.length}
                </span>
              </div>
              <div className="space-y-2">
                {boughtItems.map(item => (
                  <ShoppingRow
                    key={item.id}
                    item={item}
                    onToggle={() => markOpen(item.id)}
                    onDelete={() => deleteItem(item.id)}
                    canDelete={user.role === 'ADMIN' || item.added_by === user.id}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ShoppingRow({ item, onToggle, onDelete, canDelete }: {
  item: ShoppingListItem
  onToggle: () => void
  onDelete: () => void
  canDelete: boolean
}) {
  const isBought = item.status === 'bought'
  const name = item.equipment?.name ?? item.note ?? '—'
  const count = item.equipment?.count

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white shadow-sm cursor-pointer"
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
        isBought
          ? 'border-navy-700 bg-navy-700 text-white'
          : 'border-cream-200 bg-cream-100'
      }`}>
        {isBought && <Check size={13} strokeWidth={3} />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm text-gray-900 leading-tight ${isBought ? 'line-through text-gray-400' : ''}`}>
          {name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          von {item.user?.username ?? '—'} · {relativeTime(item.created_at)}
        </p>
      </div>

      {/* Menge */}
      {count !== undefined && (
        <span className={`text-sm font-bold shrink-0 ${isBought ? 'text-gray-400' : 'text-navy-700'}`}>
          {count} Stk.
        </span>
      )}

      {/* Löschen */}
      {canDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="shrink-0 text-gray-300 hover:text-red-400 transition-colors ml-1 p-1"
          title="Entfernen"
        >
          ×
        </button>
      )}
    </div>
  )
}
