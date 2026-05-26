import { useState, useRef } from 'react'
import { FileDown, Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import type { TournamentCategory, TournamentTask, TaskStatus } from '../../types/tournament'
import type { Equipment } from '../../types'
import { exportChecklistPDF, type TaskEquipmentEntry } from '../../lib/tournamentPdf'
import EquipmentLinker from './EquipmentLinker'
import { supabase } from '../../lib/supabase'

interface Props {
  tournamentName: string
  categories: TournamentCategory[]
  tasks: TournamentTask[]
  isAdmin: boolean
  allEquipment?: Equipment[]
  onUpdateTask: (taskId: string, changes: Partial<Pick<TournamentTask, 'title' | 'status'>>) => Promise<void>
  onAddTask: (categoryId: string, title: string) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
  onRenameCategory: (id: string, name: string) => Promise<void>
  onDeleteCategory: (id: string) => Promise<void>
  onAddChecklistCategory: (name: string) => Promise<void>
}

interface CatBlockProps {
  cat: TournamentCategory
  catTasks: TournamentTask[]
  isAdmin: boolean
  allEquipment?: Equipment[]
  onUpdateTask: Props['onUpdateTask']
  onAddTask: Props['onAddTask']
  onDeleteTask: Props['onDeleteTask']
  onRenameCategory: Props['onRenameCategory']
  onDeleteCategory: Props['onDeleteCategory']
  onPrint: (cat: TournamentCategory) => void | Promise<void>
}

function ChecklistCategoryBlock({
  cat, catTasks, isAdmin, allEquipment,
  onUpdateTask, onAddTask, onDeleteTask, onRenameCategory, onDeleteCategory,
  onPrint,
}: CatBlockProps) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(cat.name)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addingTitle, setAddingTitle] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  const done = catTasks.filter(t => t.status === 'abgeschlossen').length
  const total = catTasks.length

  async function toggleTask(task: TournamentTask) {
    const newStatus: TaskStatus = task.status === 'abgeschlossen' ? 'nicht_begonnen' : 'abgeschlossen'
    await onUpdateTask(task.id, { status: newStatus })
  }

  async function handleAddTask() {
    if (!addingTitle.trim()) return
    await onAddTask(cat.id, addingTitle.trim())
    setAddingTitle('')
    setShowAddModal(false)
  }

  async function handleRenameTask(task: TournamentTask) {
    const trimmed = editingTitle.trim()
    setEditingTaskId(null)
    if (!trimmed || trimmed === task.title) return
    await onUpdateTask(task.id, { title: trimmed })
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* Category header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-cream-100 border-b border-cream-200">
          {renaming ? (
            <div className="flex-1 flex gap-1.5">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onRenameCategory(cat.id, newName.trim()); setRenaming(false) }
                  if (e.key === 'Escape') { setRenaming(false); setNewName(cat.name) }
                }}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-navy-700"
              />
              <button onClick={() => { onRenameCategory(cat.id, newName.trim()); setRenaming(false) }} className="text-green-600"><Check size={15} /></button>
              <button onClick={() => { setRenaming(false); setNewName(cat.name) }} className="text-gray-400"><X size={15} /></button>
            </div>
          ) : (
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">{cat.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{done}/{total} erledigt</p>
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {isAdmin && !renaming && (
              <>
                <button
                  onClick={() => { setShowAddModal(true); setTimeout(() => addInputRef.current?.focus(), 50) }}
                  className="p-1 rounded text-gray-400 hover:text-navy-700 hover:bg-cream-200"
                  title="Aufgabe hinzufügen"
                ><Plus size={14} /></button>
                <button
                  onClick={() => setRenaming(true)}
                  className="p-1 rounded text-gray-400 hover:text-navy-700 hover:bg-cream-200"
                  title="Umbenennen"
                ><Pencil size={13} /></button>
                {confirmDeleteCat ? (
                  <span className="flex items-center gap-1 text-xs">
                    <span className="text-red-600 font-medium">Löschen?</span>
                    <button onClick={() => { onDeleteCategory(cat.id); setConfirmDeleteCat(false) }} className="px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700">Ja</button>
                    <button onClick={() => setConfirmDeleteCat(false)} className="px-1.5 py-0.5 rounded border border-gray-300 text-gray-600">Nein</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteCat(true)}
                    className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                    title="Kategorie löschen"
                  ><Trash2 size={13} /></button>
                )}
              </>
            )}
            <button
              onClick={() => onPrint(cat)}
              className="flex items-center gap-1 text-xs text-navy-700 hover:text-navy-800 hover:underline"
            >
              <FileDown size={13} /> Drucken
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-2 p-3">
          {catTasks.map(task => {
            const checked = task.status === 'abgeschlossen'
            return (
              <div key={task.id} className="bg-white border border-gray-100 rounded-xl shadow-sm px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTask(task)}
                    className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      checked
                        ? 'bg-navy-700 border-navy-700 text-white'
                        : 'border-cream-200 bg-cream-100'
                    }`}
                  >
                    {checked && <Check size={13} strokeWidth={3} />}
                  </button>

                  {editingTaskId === task.id ? (
                    <div className="flex-1 flex gap-1.5">
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={e => setEditingTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameTask(task)
                          if (e.key === 'Escape') setEditingTaskId(null)
                        }}
                        className="flex-1 text-sm border border-gray-300 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-navy-700"
                      />
                      <button onClick={() => handleRenameTask(task)} className="text-green-600"><Check size={15} /></button>
                      <button onClick={() => setEditingTaskId(null)} className="text-gray-400"><X size={15} /></button>
                    </div>
                  ) : (
                    <span className={`flex-1 text-sm ${checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </span>
                  )}

                  {isAdmin && editingTaskId !== task.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingTaskId(task.id); setEditingTitle(task.title); setConfirmDeleteTaskId(null) }}
                        className="p-0.5 rounded text-gray-400 hover:text-navy-700"
                        title="Aufgabe umbenennen"
                      ><Pencil size={12} /></button>
                      {confirmDeleteTaskId === task.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => { onDeleteTask(task.id); setConfirmDeleteTaskId(null) }} className="px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700">Ja</button>
                          <button onClick={() => setConfirmDeleteTaskId(null)} className="px-1.5 py-0.5 rounded border border-gray-300 text-gray-600">Nein</button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteTaskId(task.id)}
                          className="p-0.5 rounded text-gray-400 hover:text-red-600"
                          title="Aufgabe löschen"
                        ><Trash2 size={12} /></button>
                      )}
                    </div>
                  )}
                </div>

                <EquipmentLinker taskId={task.id} readOnly={!isAdmin} allEquipment={allEquipment} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Add task modal */}
      {isAdmin && showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-cream-50 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="text-lg font-bold text-navy-900">Neuer Eintrag</h2>
              <button
                onClick={() => { setShowAddModal(false); setAddingTitle('') }}
                className="p-2 rounded-full bg-cream-100 text-gray-500 hover:bg-cream-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 pb-4">
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Bezeichnung</label>
              <input
                ref={addInputRef}
                autoFocus
                value={addingTitle}
                onChange={e => setAddingTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTask()
                  if (e.key === 'Escape') { setShowAddModal(false); setAddingTitle('') }
                }}
                placeholder="z.B. Hütchen, Startnummern, Mikrofon…"
                className="w-full rounded-xl px-4 py-3 text-gray-900 bg-cream-100 border-0 focus:outline-none focus:ring-2 focus:ring-navy-700 text-sm"
              />
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowAddModal(false); setAddingTitle('') }}
                className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddTask}
                disabled={!addingTitle.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold transition-colors"
              >
                <Check size={16} /> Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function ChecklistTab({ tournamentName, categories, tasks, isAdmin, allEquipment, onUpdateTask, onAddTask, onDeleteTask, onRenameCategory, onDeleteCategory, onAddChecklistCategory }: Props) {
  const [showNewCatInput, setShowNewCatInput] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const checklistCats = categories
    .filter(c => c.is_checklist)
    .sort((a, b) => a.sort_order - b.sort_order)

  async function handleAddCategory() {
    if (!newCatName.trim()) return
    await onAddChecklistCategory(newCatName.trim())
    setNewCatName('')
    setShowNewCatInput(false)
  }

  async function buildEquipmentMap(taskIds: string[]): Promise<Record<string, TaskEquipmentEntry[]>> {
    if (taskIds.length === 0) return {}
    const { data } = await supabase
      .from('task_equipment')
      .select('task_id, equipment:equipment_id(name, room:room_id(name), cabinet:cabinet_id(name))')
      .in('task_id', taskIds)
    type Row = { task_id: string; equipment: { name: string; room?: { name: string } | null; cabinet?: { name: string } | null } }
    const map: Record<string, TaskEquipmentEntry[]> = {}
    for (const row of (data ?? []) as unknown as Row[]) {
      const loc = row.equipment.room?.name
        ? row.equipment.cabinet?.name
          ? `${row.equipment.room.name} / ${row.equipment.cabinet.name}`
          : row.equipment.room.name
        : ''
      if (!map[row.task_id]) map[row.task_id] = []
      map[row.task_id].push({ name: row.equipment.name, location: loc })
    }
    return map
  }

  async function handlePrintAll() {
    const catTasks = tasks.filter(t => checklistCats.some(c => c.id === t.category_id))
    const eqMap = await buildEquipmentMap(catTasks.map(t => t.id))
    exportChecklistPDF(tournamentName, checklistCats, catTasks, eqMap)
  }

  async function handlePrintCategory(cat: TournamentCategory) {
    const catTasks = tasks.filter(t => t.category_id === cat.id)
    const eqMap = await buildEquipmentMap(catTasks.map(t => t.id))
    exportChecklistPDF(tournamentName, [cat], catTasks, eqMap)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        {checklistCats.length > 0 && (
          <button
            onClick={handlePrintAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            <FileDown size={16} /> Alle drucken
          </button>
        )}
        {isAdmin && (
          showNewCatInput ? (
            <div className="flex items-center gap-2 flex-1 max-w-xs ml-auto">
              <input
                autoFocus
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); if (e.key === 'Escape') { setShowNewCatInput(false); setNewCatName('') } }}
                placeholder="Kategoriename..."
                className="flex-1 text-sm border border-gray-300 rounded-xl px-2 py-1.5 outline-none focus:ring-2 focus:ring-navy-700"
              />
              <button onClick={handleAddCategory} className="text-green-600"><Check size={16} /></button>
              <button onClick={() => { setShowNewCatInput(false); setNewCatName('') }} className="text-gray-400"><X size={16} /></button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCatInput(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-700 text-white text-sm hover:bg-navy-800"
            >
              <Plus size={15} /> Neue Checkliste
            </button>
          )
        )}
      </div>

      {checklistCats.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Noch keine Checklisten angelegt.</p>
          {isAdmin && <p className="text-xs mt-1 opacity-70">Klicke auf „Neue Checkliste" um eine Kategorie anzulegen.</p>}
        </div>
      )}

      {checklistCats.map(cat => (
        <ChecklistCategoryBlock
          key={cat.id}
          cat={cat}
          catTasks={tasks.filter(t => t.category_id === cat.id)}
          isAdmin={isAdmin}
          allEquipment={allEquipment}
          onUpdateTask={onUpdateTask}
          onAddTask={onAddTask}
          onDeleteTask={onDeleteTask}
          onRenameCategory={onRenameCategory}
          onDeleteCategory={onDeleteCategory}
          onPrint={handlePrintCategory}
        />
      ))}
    </div>
  )
}
