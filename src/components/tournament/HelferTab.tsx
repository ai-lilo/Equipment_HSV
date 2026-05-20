import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, FileDown, MessageCircle, Clock, GripVertical, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

const MEMBER_COLORS = [
  'bg-amber-100 text-amber-800',
  'bg-teal-100 text-teal-800',
  'bg-rose-100 text-rose-800',
  'bg-purple-100 text-purple-800',
  'bg-blue-100 text-blue-800',
  'bg-emerald-100 text-emerald-800',
  'bg-orange-100 text-orange-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-lime-100 text-lime-800',
]

function memberColor(memberId: string): string {
  const hash = memberId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return MEMBER_COLORS[hash % MEMBER_COLORS.length]
}
import type { TournamentHelper, ClubMember } from '../../types/tournament'
import { exportHelperListPDF } from '../../lib/tournamentPdf'

interface Props {
  tournamentName: string
  helpers: TournamentHelper[]
  members: ClubMember[]
  availability: string[]
  isAdmin: boolean
  onAdd: (role: string, member_id?: string, time_start?: string, time_end?: string) => Promise<void>
  onUpdate: (id: string, changes: Partial<Pick<TournamentHelper, 'role' | 'member_id' | 'time_start' | 'time_end'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder: (orderedIds: string[]) => Promise<void>
  onToggleAvailability: (memberId: string) => Promise<void>
}

const inputCls = 'w-full rounded-xl px-4 py-3 text-gray-900 bg-cream-100 border-0 focus:outline-none focus:ring-2 focus:ring-navy-700 text-sm'

function formatTime(t: string): string {
  const [h, m] = t.split(':')
  return m === '00' ? String(parseInt(h)) : `${parseInt(h)}:${m}`
}

function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} bis ${formatTime(end)} Uhr`
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{label}</label>
      {children}
    </div>
  )
}

function hasConflict(helper: TournamentHelper, all: TournamentHelper[]): boolean {
  if (!helper.member_id || !helper.time_start || !helper.time_end) return false
  return all.some(o =>
    o.id !== helper.id &&
    o.member_id === helper.member_id &&
    o.time_start && o.time_end &&
    helper.time_start! < o.time_end! &&
    helper.time_end! > o.time_start!
  )
}

export default function HelferTab({ tournamentName, helpers, members, availability, isAdmin, onAdd, onUpdate, onDelete, onReorder, onToggleAvailability }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [poolOpen, setPoolOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formRole, setFormRole] = useState('')
  const [formMemberId, setFormMemberId] = useState('')
  const [formTimeStart, setFormTimeStart] = useState('')
  const [formTimeEnd, setFormTimeEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)

  function openAdd() {
    setEditId(null)
    setFormRole('')
    setFormMemberId('')
    setFormTimeStart('')
    setFormTimeEnd('')
    setShowForm(true)
  }

  function openEdit(helper: TournamentHelper) {
    setEditId(helper.id)
    setFormRole(helper.role ?? '')
    setFormMemberId(helper.member_id ?? '')
    setFormTimeStart(helper.time_start ?? '')
    setFormTimeEnd(helper.time_end ?? '')
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditId(null)
    setFormRole('')
    setFormMemberId('')
    setFormTimeStart('')
    setFormTimeEnd('')
  }

  async function handleSave() {
    if (!formRole.trim()) return
    setSaving(true)
    if (editId) {
      await onUpdate(editId, {
        role: formRole.trim(),
        member_id: formMemberId || null,
        time_start: formTimeStart || null,
        time_end: formTimeEnd || null,
      })
    } else {
      await onAdd(formRole.trim(), formMemberId || undefined, formTimeStart || undefined, formTimeEnd || undefined)
    }
    setSaving(false)
    cancelForm()
  }

  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) { setDraggedId(null); return }
    const ids = helpers.map(h => h.id)
    const fromIdx = ids.indexOf(draggedId)
    const toIdx = ids.indexOf(targetId)
    const reordered = [...ids]
    reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, draggedId)
    setDraggedId(null)
    onReorder(reordered)
  }

  function shareWhatsApp() {
    const byPerson: Record<string, { name: string; entries: string[] }> = {}
    const unassigned: string[] = []

    for (const h of helpers) {
      const task = h.role ?? '(keine Aufgabe)'
      const time = h.time_start && h.time_end ? ` [${formatTimeRange(h.time_start, h.time_end)}]` : ''
      const entry = `  • ${task}${time}`
      if (h.member_id && h.member?.name) {
        if (!byPerson[h.member_id]) byPerson[h.member_id] = { name: h.member.name, entries: [] }
        byPerson[h.member_id].entries.push(entry)
      } else {
        unassigned.push(entry)
      }
    }

    const sections: string[] = []
    for (const { name, entries } of Object.values(byPerson)) {
      sections.push(`${name}:\n${entries.join('\n')}`)
    }
    if (unassigned.length > 0) {
      sections.push(`(keine Person zugewiesen):\n${unassigned.join('\n')}`)
    }

    const text = `Helferliste: ${tournamentName}\n\n${sections.join('\n\n')}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {helpers.length > 0 && (
          <>
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <MessageCircle size={16} /> WhatsApp
            </button>
            <button
              onClick={() => exportHelperListPDF(tournamentName, helpers)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <FileDown size={16} /> PDF drucken
            </button>
          </>
        )}
        {isAdmin && (
          <button
            onClick={openAdd}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-700 text-white text-sm hover:bg-navy-800"
          >
            <Plus size={15} /> Helfer hinzufügen
          </button>
        )}
      </div>

      {/* Empty state */}
      {helpers.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Noch keine Helfer eingetragen.</p>
          {isAdmin && <p className="text-xs mt-1 opacity-70">Klicke auf „Helfer hinzufügen" um Aufgaben anzulegen.</p>}
        </div>
      )}

      {/* Helper cards */}
      <div className="space-y-2">
        {helpers.map(helper => {
          const conflict = hasConflict(helper, helpers)
          const memberName = helper.member?.name
          const colorCls = helper.member_id ? memberColor(helper.member_id) : 'bg-gray-100 text-gray-400'
          return (
            <div
              key={helper.id}
              draggable={isAdmin}
              onDragStart={e => handleDragStart(e, helper.id)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, helper.id)}
              className={`bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3 ${draggedId === helper.id ? 'opacity-40' : ''}`}
            >
              {isAdmin && (
                <GripVertical size={16} className="text-gray-300 shrink-0 cursor-grab" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900">{helper.role ?? '—'}</p>
                  {conflict && (
                    <span title="Zeitkonflikt: Diese Person ist in dieser Zeit bereits eingeplant">
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                    </span>
                  )}
                </div>
                {helper.time_start && helper.time_end && (
                  <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Clock size={11} /> {formatTimeRange(helper.time_start, helper.time_end)}
                  </span>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${colorCls}`}>
                {memberName ?? 'Nicht zugewiesen'}
              </span>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(helper)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-navy-700 hover:bg-cream-200 transition-colors"
                  ><Pencil size={14} /></button>
                  {confirmDeleteId === helper.id ? (
                    <span className="flex items-center gap-1 text-xs">
                      <button
                        onClick={() => { onDelete(helper.id); setConfirmDeleteId(null) }}
                        className="px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700"
                      >Ja</button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-1.5 py-0.5 rounded border border-gray-300 text-gray-600"
                      >Nein</button>
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(helper.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    ><Trash2 size={14} /></button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Verfügbare Personen Pool */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <button
            onClick={() => setPoolOpen(o => !o)}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            {poolOpen ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
            <span className="text-sm font-semibold text-gray-800">Verfügbare Personen heute</span>
            <span className="ml-auto text-xs text-gray-400 shrink-0">{availability.length} ausgewählt</span>
          </button>
          {poolOpen && (
            <div className="border-t border-gray-100 px-4 py-3 space-y-2">
              {members.map(m => {
                const isAvail = availability.includes(m.id)
                const isAssigned = helpers.some(h => h.member_id === m.id)
                return (
                  <label key={m.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAvail}
                      onChange={() => onToggleAvailability(m.id)}
                      className="w-4 h-4 rounded accent-navy-700"
                    />
                    <span className="flex-1 text-sm text-gray-800">{m.name}</span>
                    {isAvail && !isAssigned && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">noch nicht eingeplant</span>
                    )}
                    {isAvail && isAssigned && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">eingeplant</span>
                    )}
                  </label>
                )
              })}
              {availability.length > 0 && (() => {
                const unplanned = members.filter(m => availability.includes(m.id) && !helpers.some(h => h.member_id === m.id))
                if (unplanned.length === 0) return null
                return (
                  <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-amber-700 font-medium">
                    Noch nicht eingeplant: {unplanned.map(m => m.name).join(', ')}
                  </p>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit form dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-cream-50 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="text-lg font-bold text-navy-900">
                {editId ? 'Helfer bearbeiten' : 'Helfer hinzufügen'}
              </h2>
              <button onClick={cancelForm} className="p-2 rounded-full bg-cream-100 text-gray-500 hover:bg-cream-200 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-4 space-y-4">
              <Field label="Aufgabe *">
                <input
                  autoFocus
                  value={formRole}
                  onChange={e => setFormRole(e.target.value)}
                  placeholder="z.B. Aufbau, Parcours, Zeitnahme"
                  className={inputCls}
                />
              </Field>
              <Field label="Person">
                <select
                  value={formMemberId}
                  onChange={e => setFormMemberId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Noch nicht zugewiesen</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Von">
                  <input
                    type="time"
                    value={formTimeStart}
                    onChange={e => setFormTimeStart(e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Bis">
                  <input
                    type="time"
                    value={formTimeEnd}
                    onChange={e => setFormTimeEnd(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={cancelForm}
                className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formRole.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold transition-colors"
              >
                <Check size={16} />
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
