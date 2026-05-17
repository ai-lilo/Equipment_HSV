import { useState, useRef } from 'react'
import { FileDown, Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import type { TournamentCategory, TournamentTask, TaskStatus } from '../../types/tournament'
import { exportChecklistPDF, type TaskEquipmentEntry } from '../../lib/tournamentPdf'
import EquipmentLinker from './EquipmentLinker'
import { supabase } from '../../lib/supabase'

interface Props {
  tournamentName: string
  categories: TournamentCategory[]
  tasks: TournamentTask[]
  isAdmin: boolean
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
  onUpdateTask: Props['onUpdateTask']
  onAddTask: Props['onAddTask']
  onDeleteTask: Props['onDeleteTask']
  onRenameCategory: Props['onRenameCategory']
  onDeleteCategory: Props['onDeleteCategory']
  onPrint: (cat: TournamentCategory) => void | Promise<void>
}

function ChecklistCategoryBlock({
  cat, catTasks, isAdmin,
  onUpdateTask, onAddTask, onDeleteTask, onRenameCategory, onDeleteCategory,
  onPrint,
}: CatBlockProps) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(cat.name)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(false)
  const [showAddInput, setShowAddInput] = useState(false)
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
    setShowAddInput(false)
  }

  async function handleRenameTask(task: TournamentTask) {
    const trimmed = editingTitle.trim()
    setEditingTaskId(null)
    if (!trimmed || trimmed === task.title) return
    await onUpdateTask(task.id, { title: trimmed })
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Category header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
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
              className="flex-1 text-sm border border-blue-400 rounded px-2 py-0.5 dark:bg-gray-700 dark:text-white outline-none"
            />
            <button onClick={() => { onRenameCategory(cat.id, newName.trim()); setRenaming(false) }} className="text-green-600"><Check size={15} /></button>
            <button onClick={() => { setRenaming(false); setNewName(cat.name) }} className="text-gray-400 dark:text-gray-500"><X size={15} /></button>
          </div>
        ) : (
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{cat.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{done}/{total} erledigt</p>
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && !renaming && (
            <>
              <button
                onClick={() => { setShowAddInput(true); setTimeout(() => addInputRef.current?.focus(), 50) }}
                className="p-1 rounded text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40"
                title="Aufgabe hinzufügen"
              ><Plus size={14} /></button>
              <button
                onClick={() => setRenaming(true)}
                className="p-1 rounded text-gray-400 dark:text-gray-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40"
                title="Umbenennen"
              ><Pencil size={13} /></button>
              {confirmDeleteCat ? (
                <span className="flex items-center gap-1 text-xs">
                  <span className="text-red-600 dark:text-red-400 font-medium">Löschen?</span>
                  <button onClick={() => { onDeleteCategory(cat.id); setConfirmDeleteCat(false) }} className="px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700">Ja</button>
                  <button onClick={() => setConfirmDeleteCat(false)} className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">Nein</button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDeleteCat(true)}
                  className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Kategorie löschen"
                ><Trash2 size={13} /></button>
              )}
            </>
          )}
          <button
            onClick={() => onPrint(cat)}
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FileDown size={13} /> Drucken
          </button>
        </div>
      </div>

      {/* Task list */}
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {catTasks.map(task => {
          const checked = task.status === 'abgeschlossen'
          return (
            <li key={task.id} className="px-4 py-2.5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleTask(task)}
                  className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                    checked ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-500'
                  }`}
                >
                  {checked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
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
                      className="flex-1 text-sm border border-blue-400 rounded px-2 py-0.5 dark:bg-gray-700 dark:text-white outline-none"
                    />
                    <button onClick={() => handleRenameTask(task)} className="text-green-600"><Check size={15} /></button>
                    <button onClick={() => setEditingTaskId(null)} className="text-gray-400 dark:text-gray-500"><X size={15} /></button>
                  </div>
                ) : (
                  <span className={`flex-1 text-sm ${checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    {task.title}
                  </span>
                )}

                {isAdmin && editingTaskId !== task.id && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingTaskId(task.id); setEditingTitle(task.title); setConfirmDeleteTaskId(null) }}
                      className="p-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                      title="Aufgabe umbenennen"
                    ><Pencil size={12} /></button>
                    {confirmDeleteTaskId === task.id ? (
                      <span className="flex items-center gap-1 text-xs">
                        <button onClick={() => { onDeleteTask(task.id); setConfirmDeleteTaskId(null) }} className="px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700">Ja</button>
                        <button onClick={() => setConfirmDeleteTaskId(null)} className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">Nein</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteTaskId(task.id)}
                        className="p-0.5 rounded text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                        title="Aufgabe löschen"
                      ><Trash2 size={12} /></button>
                    )}
                  </div>
                )}
              </div>

              <EquipmentLinker taskId={task.id} readOnly={!isAdmin} />
            </li>
          )
        })}

        {isAdmin && showAddInput && (
          <li className="px-4 py-2.5">
            <div className="flex gap-1.5">
              <input
                ref={addInputRef}
                value={addingTitle}
                onChange={e => setAddingTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTask()
                  if (e.key === 'Escape') { setShowAddInput(false); setAddingTitle('') }
                }}
                placeholder="Neue Aufgabe..."
                className="flex-1 text-sm border border-blue-400 rounded-lg px-2.5 py-1.5 dark:bg-gray-700 dark:text-white outline-none"
              />
              <button onClick={handleAddTask} className="px-3 py-1.5 rounded-lg bg-blue-800 text-white text-sm hover:bg-blue-900">OK</button>
              <button onClick={() => { setShowAddInput(false); setAddingTitle('') }} className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
                <X size={15} />
              </button>
            </div>
          </li>
        )}
      </ul>
    </div>
  )
}

export default function ChecklistTab({ tournamentName, categories, tasks, isAdmin, onUpdateTask, onAddTask, onDeleteTask, onRenameCategory, onDeleteCategory, onAddChecklistCategory }: Props) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        {checklistCats.length > 0 && (
          <button
            onClick={handlePrintAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <FileDown size={16} /> Alle Checklisten drucken
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
                className="flex-1 text-sm border border-blue-400 rounded-lg px-2 py-1.5 dark:bg-gray-700 dark:text-white outline-none"
              />
              <button onClick={handleAddCategory} className="text-green-600"><Check size={16} /></button>
              <button onClick={() => { setShowNewCatInput(false); setNewCatName('') }} className="text-gray-400 dark:text-gray-500"><X size={16} /></button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCatInput(true)}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-800 text-white text-sm hover:bg-blue-900"
            >
              <Plus size={15} /> Neue Checkliste
            </button>
          )
        )}
      </div>

      {checklistCats.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
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
