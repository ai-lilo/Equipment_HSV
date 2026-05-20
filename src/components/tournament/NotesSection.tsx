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
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Veranstaltungsnotizen</h3>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={!isAdmin}
          rows={12}
          placeholder={isAdmin ? 'Notizen zur Veranstaltung, Verbesserungsideen, Besonderheiten...' : 'Keine Notizen vorhanden.'}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-700 resize-y disabled:opacity-60"
        />
        {isAdmin && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-700 text-white text-sm hover:bg-navy-800 disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        )}
      </div>

      {bestPractices.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <button
            onClick={() => setBpOpen(o => !o)}
            className="w-full flex items-center gap-2 px-4 py-3 bg-cream-100 border-b border-gray-200"
          >
            {bpOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="text-sm font-semibold text-gray-800">Best Practices (KI-generiert)</span>
            <span className="ml-auto text-xs text-gray-500">{bestPractices.length} Einträge</span>
          </button>
          {bpOpen && (
            <div className="p-4 space-y-4">
              {bestPractices.map(bp => (
                <div key={bp.id}>
                  <p className="text-xs text-gray-400 mb-1">
                    {new Date(bp.generated_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{bp.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
