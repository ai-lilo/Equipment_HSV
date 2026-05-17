import { useState, useRef } from 'react'
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Check, X, GripVertical } from 'lucide-react'
import type { User } from '../../types'
import type { TournamentCategory, TournamentTask, TaskStatus } from '../../types/tournament'
import TaskCard from './TaskCard'
import TaskForm from './TaskForm'

interface Props {
  category: TournamentCategory
  tasks: TournamentTask[]
  users: User[]
  currentUser: User
  isAdmin: boolean
  onAddTask: (categoryId: string, title: string) => Promise<void>
  onUpdateTask: (id: string, changes: Partial<TournamentTask>) => Promise<void>
  onDeleteTask: (id: string) => Promise<void>
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDragStart: (e: React.DragEvent, id: string) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, id: string) => void
  statusFilter: string | null
  onNavigateEquipment?: () => void
}

export default function CategorySection({
  category, tasks, users, currentUser, isAdmin,
  onAddTask, onUpdateTask, onDeleteTask,
  onRename, onDelete,
  onDragStart, onDragOver, onDrop,
  statusFilter, onNavigateEquipment,
}: Props) {
  const [open, setOpen] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(category.name)
  const [addingTitle, setAddingTitle] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [editTask, setEditTask] = useState<TournamentTask | null>(null)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(false)
  const addInputRef = useRef<HTMLInputElement>(null)

  const visibleTasks = tasks.filter(t => {
    if (!statusFilter) return true
    if (statusFilter === 'ueberfaellig') {
      return t.due_date && t.status !== 'abgeschlossen' && new Date(t.due_date) < new Date(new Date().toDateString())
    }
    return t.status === statusFilter
  })

  async function handleAddTask() {
    if (!addingTitle.trim()) return
    await onAddTask(category.id, addingTitle.trim())
    setAddingTitle('')
    setShowAddInput(false)
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    await onUpdateTask(id, { status })
  }

  return (
    <>
      <div
        draggable={isAdmin}
        onDragStart={e => onDragStart(e, category.id)}
        onDragOver={onDragOver}
        onDrop={e => onDrop(e, category.id)}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Category header */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
          {isAdmin && (
            <GripVertical size={16} className="text-gray-300 dark:text-gray-600 shrink-0 cursor-grab" />
          )}
          <button onClick={() => setOpen(o => !o)} className="text-gray-500 dark:text-gray-400 shrink-0">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {renaming ? (
            <div className="flex-1 flex gap-1.5">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onRename(category.id, newName.trim()); setRenaming(false) }
                  if (e.key === 'Escape') { setRenaming(false); setNewName(category.name) }
                }}
                className="flex-1 text-sm border border-blue-400 rounded px-2 py-0.5 dark:bg-gray-700 dark:text-white outline-none"
              />
              <button onClick={() => { onRename(category.id, newName.trim()); setRenaming(false) }} className="text-green-600"><Check size={15} /></button>
              <button onClick={() => { setRenaming(false); setNewName(category.name) }} className="text-gray-400"><X size={15} /></button>
            </div>
          ) : (
            <span className="flex-1 text-sm font-semibold text-gray-800 dark:text-white">{category.name}</span>
          )}

          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{tasks.length}</span>

          {isAdmin && !renaming && (
            <>
              <button
                onClick={() => { setShowAddInput(true); setOpen(true); setTimeout(() => addInputRef.current?.focus(), 50) }}
                className="p-1 rounded text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                title="Aufgabe hinzufügen"
              >
                <Plus size={15} />
              </button>
              <button onClick={() => setRenaming(true)} className="p-1 rounded text-gray-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <Pencil size={13} />
              </button>
              {confirmDeleteCat ? (
                <span className="flex items-center gap-1 text-xs">
                  <span className="text-red-600 dark:text-red-400 font-medium">Löschen?</span>
                  <button onClick={() => { onDelete(category.id); setConfirmDeleteCat(false) }} className="px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700">Ja</button>
                  <button onClick={() => setConfirmDeleteCat(false)} className="px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Nein</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDeleteCat(true)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 size={13} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Tasks */}
        {open && (
          <div className="p-2 space-y-1.5">
            {visibleTasks.length === 0 && !showAddInput && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">Keine Aufgaben</p>
            )}
            {visibleTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                users={users}
                currentUser={currentUser}
                onEdit={setEditTask}
                onStatusChange={handleStatusChange}
              />
            ))}

            {showAddInput && (
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
                  className="flex-1 text-sm border border-blue-400 rounded-lg px-2.5 py-1.5 dark:bg-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button onClick={handleAddTask} className="px-3 py-1.5 rounded-lg bg-blue-800 text-white text-sm hover:bg-blue-900">
                  OK
                </button>
                <button onClick={() => { setShowAddInput(false); setAddingTitle('') }} className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editTask && (
        <TaskForm
          task={editTask}
          users={users}
          currentUser={currentUser}
          onSave={async changes => { await onUpdateTask(editTask.id, changes) }}
          onDelete={async () => { await onDeleteTask(editTask.id) }}
          onClose={() => setEditTask(null)}
          onNavigateEquipment={onNavigateEquipment}
        />
      )}
    </>
  )
}
