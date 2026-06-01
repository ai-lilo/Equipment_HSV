import { useState, useEffect, useRef } from 'react'
import { Image as ImageIcon, ShoppingCart, BookOpen } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import type { Equipment, Category } from '../../types'

interface Props {
  item: Equipment
  canEdit: boolean
  categories: Category[]
  openShoppingIds: Set<string>
  instructionCount: number
  onEdit: (item: Equipment) => void
  onAddToShoppingList?: (item: Equipment) => Promise<'added' | 'duplicate'>
}

export default function EquipmentCard({ item, canEdit, categories, openShoppingIds, instructionCount, onEdit, onAddToShoppingList }: Props) {
  const [feedback, setFeedback] = useState<'added' | 'duplicate' | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current) }, [])

  const isOnList = openShoppingIds.has(item.id)
  const catName = categories.find(c => c.id === item.category_id)?.name

  async function handleCartClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!onAddToShoppingList) return
    const result = await onAddToShoppingList(item)
    setFeedback(result)
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2000)
  }

  return (
    <div
      className={`rounded-xl overflow-hidden bg-cream-100 flex flex-col aspect-[3/4] ${canEdit ? 'cursor-pointer' : ''}`}
      onClick={() => canEdit && onEdit(item)}
    >
      {/* Foto-Bereich */}
      <div className="relative flex-1 min-h-0">
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon size={32} className="text-cream-200" />
          </div>
        )}
        {instructionCount > 0 && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-navy-700/80 text-white text-xs rounded-full px-1.5 py-0.5">
            <BookOpen size={9} />
            <span className="font-semibold">{instructionCount}</span>
          </div>
        )}
      </div>

      {/* Beige Info-Balken */}
      <div className="bg-cream-100 px-2.5 py-2 flex items-center gap-2 shrink-0">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate leading-tight">{item.name}</p>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {catName ? `${catName.toUpperCase()} · ${item.count} Stk.` : `${item.count} Stk.`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge status={item.status} />
          {onAddToShoppingList && item.is_consumable && (
            <button
              onClick={handleCartClick}
              className={`p-1.5 rounded-full transition-colors ${
                isOnList || feedback !== null
                  ? 'bg-navy-700 text-white'
                  : 'bg-cream-200 text-gray-500 hover:bg-navy-700 hover:text-white'
              }`}
              title="Auf Einkaufsliste"
            >
              <ShoppingCart size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
