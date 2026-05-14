import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, Check, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { User, ShoppingListItem } from '../types'

interface Props {
  user: User
}

export default function ShoppingList({ user }: Props) {
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('shopping_list')
      .select('*, equipment:equipment_id(name, description), user:added_by(username)')
      .order('created_at', { ascending: false })
    setItems((data ?? []) as ShoppingListItem[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-center text-gray-400 py-12">Lade…</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart size={22} className="text-blue-700 dark:text-blue-400" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Einkaufsliste</h1>
        {openItems.length > 0 && (
          <span className="ml-1 text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-2 py-0.5 rounded-full">
            {openItems.length} offen
          </span>
        )}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
          <p>Die Einkaufsliste ist leer.</p>
          <p className="text-sm mt-1">Equipment mit Kategorie „Verbrauchsmaterial" kann über den Warenkorb-Button hinzugefügt werden.</p>
        </div>
      )}

      {openItems.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Offen</h2>
          <div className="space-y-2">
            {openItems.map(item => (
              <ShoppingListRow
                key={item.id}
                item={item}
                onMarkBought={() => markBought(item.id)}
                onMarkOpen={() => markOpen(item.id)}
                onDelete={() => deleteItem(item.id)}
                canDelete={user.role === 'ADMIN' || item.added_by === user.id}
              />
            ))}
          </div>
        </section>
      )}

      {boughtItems.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Gekauft</h2>
          <div className="space-y-2 opacity-60">
            {boughtItems.map(item => (
              <ShoppingListRow
                key={item.id}
                item={item}
                onMarkBought={() => markBought(item.id)}
                onMarkOpen={() => markOpen(item.id)}
                onDelete={() => deleteItem(item.id)}
                canDelete={user.role === 'ADMIN' || item.added_by === user.id}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ShoppingListRow({ item, onMarkBought, onMarkOpen, onDelete, canDelete }: {
  item: ShoppingListItem
  onMarkBought: () => void
  onMarkOpen: () => void
  onDelete: () => void
  canDelete: boolean
}) {
  const isBought = item.status === 'bought'
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
      isBought
        ? 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
        : 'border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800'
    }`}>
      <button
        onClick={isBought ? onMarkOpen : onMarkBought}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          isBought
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-gray-300 dark:border-gray-500 hover:border-green-500'
        }`}
        title={isBought ? 'Als offen markieren' : 'Als gekauft markieren'}
      >
        {isBought && <Check size={13} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-gray-900 dark:text-white ${isBought ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
          {item.equipment?.name ?? '—'}
        </p>
        {item.equipment?.description && (
          <p className="text-xs text-gray-400 truncate">{item.equipment.description}</p>
        )}
        <p className="text-xs text-gray-400">
          von {item.user?.username ?? '—'} · {new Date(item.created_at).toLocaleDateString('de-DE')}
        </p>
      </div>

      {canDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors shrink-0"
          title="Entfernen"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}
