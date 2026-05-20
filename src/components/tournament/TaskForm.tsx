import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { User } from '../../types'
import type { TournamentTask, TaskStatus } from '../../types/tournament'
import EquipmentLinker from './EquipmentLinker'

interface Props {
  task: TournamentTask | null
  categoryId?: string
  users: User[]
  currentUser: User
  onSave: (changes: Partial<TournamentTask> & { title?: string }) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
  onNavigateEquipment?: () => void
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

export default function TaskForm({ task, categoryId: _categoryId, users, currentUser, onSave, onDelete, onClose, onNavigateEquipment: _onNavigateEquipment }: Props) {
  const isNew = task === null
  const isAdmin = currentUser.role === 'ADMIN'
  const isMember = currentUser.role === 'MEMBER'
  const isOwn = task?.responsible_user_id === currentUser.id

  const canEditAll = isNew || isAdmin || isMember
  const canEditOwn = !canEditAll && isOwn

  const [title, setTitle] = useState(task?.title ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'nicht_begonnen')
  const [responsibleId, setResponsibleId] = useState<string>(task?.responsible_user_id ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setTitle(task?.title ?? '')
    setStatus(task?.status ?? 'nicht_begonnen')
    setResponsibleId(task?.responsible_user_id ?? '')
    setDueDate(task?.due_date ?? '')
    setNotes(task?.notes ?? '')
  }, [task])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    const changes: Partial<TournamentTask> & { title?: string } = {}
    if (canEditAll) {
      changes.title = title.trim()
      changes.responsible_user_id = responsibleId || null
      changes.due_date = dueDate || null
    }
    changes.status = status
    changes.notes = notes || null
    await onSave(changes)
    setSaving(false)
    onClose()
  }

  const statusOptions: { v: TaskStatus; l: string; active: string }[] = [
    { v: 'nicht_begonnen', l: 'Offen',     active: 'bg-gray-200 text-gray-700' },
    { v: 'in_arbeit',      l: 'In Arbeit', active: 'bg-amber-100 text-amber-700' },
    { v: 'abgeschlossen',  l: 'Erledigt',  active: 'bg-green-100 text-green-700' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
      <div className="bg-cream-50 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-lg font-bold text-navy-900">
            {isNew ? 'Neue Aufgabe' : 'Aufgabe bearbeiten'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full bg-cream-100 text-gray-500 hover:bg-cream-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-4 space-y-4">
          {canEditAll && (
            <Field label="Titel">
              <input
                autoFocus={isNew}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Aufgabentitel"
                className={inputCls}
              />
            </Field>
          )}

          {(canEditAll || canEditOwn) && (
            <Field label="Status">
              <div className="flex rounded-xl bg-cream-100 p-1 gap-1">
                {statusOptions.map(opt => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setStatus(opt.v)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === opt.v ? opt.active : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {canEditAll && (
            <Field label="Verantwortliche Person">
              <select value={responsibleId} onChange={e => setResponsibleId(e.target.value)} className={inputCls}>
                <option value="">— Niemand zugewiesen —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </Field>
          )}

          {canEditAll && (
            <Field label="Zieldatum">
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className={inputCls}
                />
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-red-500"
                  >
                    × entfernen
                  </button>
                )}
              </div>
            </Field>
          )}

          {(canEditAll || canEditOwn) && (
            <Field label="Notizen">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className={`${inputCls} resize-none`}
                placeholder="Hinweise zur Aufgabe"
              />
            </Field>
          )}

          {!isNew && task && (
            <div>
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Inventar</label>
              <EquipmentLinker taskId={task.id} readOnly={!canEditAll} />
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          {onDelete && canEditAll && !isNew && (
            confirmDelete ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
                <span className="text-xs text-red-700">Wirklich löschen?</span>
                <button
                  onClick={async () => { await onDelete(); onClose() }}
                  className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700"
                >Ja</button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 rounded-lg border border-gray-300 text-xs text-gray-700"
                >Nein</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm hover:bg-red-100"
              >
                <Trash2 size={15} />
              </button>
            )
          )}
          <div className="flex-1 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="flex-1 py-3 rounded-xl bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold transition-colors"
            >
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
