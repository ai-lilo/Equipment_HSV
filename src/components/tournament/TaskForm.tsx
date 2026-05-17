import { useState, useEffect, useRef } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import flatpickr from 'flatpickr'
import { German } from 'flatpickr/dist/l10n/de.js'
import 'flatpickr/dist/flatpickr.min.css'
import type { User } from '../../types'
import type { TournamentTask, TaskStatus } from '../../types/tournament'
import EquipmentLinker from './EquipmentLinker'

interface Props {
  task: TournamentTask | null
  users: User[]
  currentUser: User
  onSave: (changes: Partial<TournamentTask> & { category_id?: string; title?: string }) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
  onNavigateEquipment?: () => void
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'nicht_begonnen', label: '⚪ Nicht begonnen' },
  { value: 'in_arbeit',      label: '🟡 In Arbeit' },
  { value: 'abgeschlossen',  label: '✅ Abgeschlossen' },
]

export default function TaskForm({ task, users, currentUser, onSave, onDelete, onClose, onNavigateEquipment }: Props) {
  const isAdmin = currentUser.role === 'ADMIN'
  const isMember = currentUser.role === 'MEMBER'
  const isOwn = task?.responsible_user_id === currentUser.id

  const canEditAll = isAdmin || isMember
  const canEditOwn = !canEditAll && isOwn

  const [title, setTitle] = useState(task?.title ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'nicht_begonnen')
  const [responsibleId, setResponsibleId] = useState<string>(task?.responsible_user_id ?? '')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)
  const fpRef = useRef<flatpickr.Instance | null>(null)

  useEffect(() => {
    setTitle(task?.title ?? '')
    setStatus(task?.status ?? 'nicht_begonnen')
    setResponsibleId(task?.responsible_user_id ?? '')
    setDueDate(task?.due_date ?? '')
    setNotes(task?.notes ?? '')
  }, [task])

  useEffect(() => {
    if (!dateInputRef.current) return
    fpRef.current = flatpickr(dateInputRef.current, {
      locale: German,
      dateFormat: 'd.m.Y',
      defaultDate: dueDate || undefined,
      onChange: (dates) => {
        if (dates[0]) {
          const d = dates[0]
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          setDueDate(iso)
        } else {
          setDueDate('')
        }
      },
    }) as flatpickr.Instance
    return () => { fpRef.current?.destroy() }
  }, [])

  useEffect(() => {
    fpRef.current?.setDate(dueDate || '', false)
  }, [dueDate])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    const changes: Partial<TournamentTask> & { category_id?: string; title?: string } = {}
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {task ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Titel */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Titel *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={!canEditAll}
              className={inputCls}
              placeholder="Aufgabentitel"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as TaskStatus)}
              disabled={!canEditAll && !canEditOwn}
              className={inputCls}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Verantwortliche Person */}
          {canEditAll && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Verantwortliche Person</label>
              <select
                value={responsibleId}
                onChange={e => setResponsibleId(e.target.value)}
                className={inputCls}
              >
                <option value="">— Niemand zugewiesen —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
          )}

          {/* Zieldatum */}
          {canEditAll && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Zieldatum</label>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => { setDueDate(''); fpRef.current?.clear() }}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    × Datum entfernen
                  </button>
                )}
              </div>
              <input
                ref={dateInputRef}
                readOnly
                placeholder="TT.MM.JJJJ"
                className={inputCls}
              />
            </div>
          )}

          {/* Notizen */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notizen</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={!canEditAll && !canEditOwn}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Hinweise"
            />
          </div>

          {/* Equipment-Verknüpfung */}
          {task && (
            <EquipmentLinker
              taskId={task.id}
              readOnly={!canEditAll}
              onNavigateEquipment={onNavigateEquipment}
            />
          )}
        </div>

        <div className="flex gap-2 mt-5">
          {onDelete && canEditAll && (
            confirmDelete ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
                <span className="text-xs text-red-700 dark:text-red-300">Wirklich löschen?</span>
                <button
                  onClick={async () => { await onDelete(); onClose() }}
                  className="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                >
                  Ja
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300"
                >
                  Nein
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 text-sm hover:bg-red-100"
              >
                <Trash2 size={15} /> Löschen
              </button>
            )
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-800 text-white text-sm hover:bg-blue-900 disabled:opacity-50"
          >
            <Save size={15} /> Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
