import { useState } from 'react'
import { Pencil, AlertCircle, Image as ImageIcon, X } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import type { Equipment } from '../../types'

interface Props {
  item: Equipment
  canEdit: boolean
  onEdit: (item: Equipment) => void
}

export default function EquipmentCard({ item, canEdit, onEdit }: Props) {
  const [photoOpen, setPhotoOpen] = useState(false)

  return (
    <>
      <div className={`flex items-start gap-3 px-3 py-2.5 rounded-lg bg-white dark:bg-gray-800 border ${
        item.status !== 'OK' ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
      }`}>
        {item.photo_url && (
          <button
            onClick={() => setPhotoOpen(true)}
            className="shrink-0 mt-0.5"
            title="Foto anzeigen"
          >
            <img
              src={item.photo_url}
              alt={item.name}
              className="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
            />
          </button>
        )}
        {!item.photo_url && (
          <div className="shrink-0 w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mt-0.5">
            <ImageIcon size={16} className="text-gray-300 dark:text-gray-600" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-white truncate">{item.name}</span>
            <StatusBadge status={item.status} />
            {item.sport && (
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                {item.sport}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-sm text-gray-500 dark:text-gray-400">Anzahl: {item.count}</span>
            {item.description && (
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{item.description}</span>
            )}
          </div>
          {item.defect_note && (
            <div className="flex items-center gap-1 mt-1 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={14} />
              {item.defect_note}
            </div>
          )}
        </div>

        {canEdit && (
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors shrink-0"
            title="Bearbeiten"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      {photoOpen && item.photo_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          onClick={() => setPhotoOpen(false)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPhotoOpen(false)}
              className="absolute -top-3 -right-3 z-10 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow text-gray-600 dark:text-gray-300 hover:text-red-600"
            >
              <X size={18} />
            </button>
            <img
              src={item.photo_url}
              alt={item.name}
              className="w-full rounded-xl shadow-2xl"
            />
            <p className="text-center text-white text-sm mt-3 font-medium">{item.name}</p>
          </div>
        </div>
      )}
    </>
  )
}
