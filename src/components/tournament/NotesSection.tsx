import { useState } from 'react'
import { Save, ChevronDown, ChevronRight } from 'lucide-react'
import type { TournamentNote, BestPractice } from '../../types/tournament'

interface Props {
  note: TournamentNote | null
  bestPractices: BestPractice[]
  isAdmin: boolean
  onSaveNote: (content: string) => Promise<void>
}

export default function NotesSection({ note, bestPractices, isAdmin, onSaveNote }: Props) {
  const [content, setContent] = useState(note?.content ?? '')
  const [saving, setSaving] = useState(false)
  const [bpOpen, setBpOpen] = useState(true)

  async function handleSave() {
    setSaving(true)
    await onSaveNote(content)
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {/* Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">📝 Turniernotizen</h3>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={!isAdmin}
          rows={6}
          placeholder={isAdmin ? 'Notizen zum Turnier, Verbesserungsideen, Besonderheiten...' : 'Keine Notizen vorhanden.'}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-60"
        />
        {isAdmin && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-800 text-white text-sm hover:bg-blue-900 disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        )}
      </div>

      {/* Best Practices */}
      {bestPractices.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 overflow-hidden">
          <button
            onClick={() => setBpOpen(o => !o)}
            className="w-full flex items-center gap-2 px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-700"
          >
            {bpOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">✨ Best Practices (KI-generiert)</span>
            <span className="ml-auto text-xs text-purple-500 dark:text-purple-400">{bestPractices.length} Einträge</span>
          </button>
          {bpOpen && (
            <div className="p-4 space-y-4">
              {bestPractices.map(bp => (
                <div key={bp.id}>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                    {new Date(bp.generated_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{bp.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
