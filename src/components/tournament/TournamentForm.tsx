import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import type { TournamentTemplate } from '../../types/tournament'

interface Props {
  templates: TournamentTemplate[]
  onSave: (name: string, date: string, templateId: string | null) => Promise<void>
  onClose: () => void
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function TournamentForm({ templates, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [templateId, setTemplateId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim() || !date) return
    setSaving(true)
    await onSave(name.trim(), date, templateId || null)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Neue Veranstaltung</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Rally Obedience 2026"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Datum *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vorlage (optional)</label>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)} className={inputCls}>
              <option value="">— Keine Vorlage —</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          {templateId && (
            <p className="text-xs text-blue-600 dark:text-blue-400">
              ℹ️ Alle Kategorien und Aufgaben der Vorlage werden kopiert. Status wird auf "Nicht begonnen" zurückgesetzt.
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !date}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-800 text-white text-sm hover:bg-blue-900 disabled:opacity-50"
          >
            <Plus size={15} /> {saving ? 'Anlegen...' : 'Veranstaltung anlegen'}
          </button>
        </div>
      </div>
    </div>
  )
}
