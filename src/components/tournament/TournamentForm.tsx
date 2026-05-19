import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import type { TournamentTemplate } from '../../types/tournament'

interface Props {
  templates: TournamentTemplate[]
  existing?: { name: string; date: string }
  onSave: (name: string, date: string, templateId: string | null) => Promise<void>
  onClose: () => void
}

const inputCls = 'w-full rounded-xl px-4 py-3 text-gray-900 bg-cream-100 border-0 focus:outline-none focus:ring-2 focus:ring-navy-700'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{label}</label>
      {children}
    </div>
  )
}

export default function TournamentForm({ templates, existing, onSave, onClose }: Props) {
  const isEdit = !!existing
  const [name, setName] = useState(existing?.name ?? '')
  const [date, setDate] = useState(existing?.date ?? '')
  const [templateId, setTemplateId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim() || !date) return
    setSaving(true)
    await onSave(name.trim(), date, isEdit ? null : (templateId || null))
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
      <div className="bg-cream-50 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-lg font-bold text-navy-900">
            {isEdit ? 'Veranstaltung bearbeiten' : 'Neue Veranstaltung'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full bg-cream-100 text-gray-500 hover:bg-cream-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-4 space-y-4">
          <Field label="Name">
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Rally Obedience 2026"
              className={inputCls}
            />
          </Field>

          <Field label="Datum">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={inputCls}
            />
          </Field>

          {!isEdit && (
            <Field label="Vorlage (optional)">
              <select value={templateId} onChange={e => setTemplateId(e.target.value)} className={inputCls}>
                <option value="">— Keine Vorlage —</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {templateId && (
                <p className="text-xs text-navy-700 mt-2">
                  Alle Kategorien und Aufgaben der Vorlage werden kopiert. Status wird auf „Nicht begonnen" zurückgesetzt.
                </p>
              )}
            </Field>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !date}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {!isEdit && <Plus size={16} />}
            {saving ? 'Speichern…' : isEdit ? 'Speichern' : 'Anlegen'}
          </button>
        </div>
      </div>
    </div>
  )
}
