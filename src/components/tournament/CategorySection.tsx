import { useState } from 'react'
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
  onAddTask: (categoryId: string, title: string, userId?: string, extra?: Partial<Pick<TournamentTask, 'status' | 'responsible_user_id' | 'due_date' | 'notes'>>) => Promise<void>
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
  statusFilter,
}: Props) {
  const [open, setOpen] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(category.name)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editTask, setEditTask] = useState<TournamentTask | null>(null)
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(false)

  const visibleTasks = tasks.filter(t => {
    if (!statusFilter) return true
    if (statusFilter === 'ueberfaellig') {
      return t.due_date && t.status !== 'abgeschlossen' && new Date(t.due_date) < new Date(new Date().toDateString())
    }
    return t.status === statusFilter
  })

  const doneCount = tasks.filter(t => t.status === 'abgeschlossen').length

  async function handleCreateTask(changes: Partial<TournamentTask> & { title?: string }) {
    if (!changes.title?.trim()) return
    await onAddTask(category.id, changes.title.trim(), currentUser.id, {
      status: changes.status,
      responsible_user_id: changes.responsible_user_id ?? null,
      due_date: changes.due_date ?? null,
      notes: changes.notes ?? null,
    })
    setShowAddForm(false)
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
      >
        <div className="flex items-center gap-2 py-2 mb-2">
          {isAdmin && (
            <GripVertical size={16} className="text-gray-300 shrink-0 cursor-grab" />
          )}
          <button onClick={() => setOpen(o => !o)} className="text-gray-400 shrink-0">
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
                className="flex-1 text-sm border border-gray-300 rounded-xl px-2 py-0.5 outline-none focus:ring-2 focus:ring-navy-700"
              />
              <button onClick={() => { onRename(category.id, newName.trim()); setRenaming(false) }} className="text-green-600"><Check size={15} /></button>
              <button onClick={() => { setRenaming(false); setNewName(category.name) }} className="text-gray-400"><X size={15} /></button>
            </div>
          ) : (
            <span className="flex-1 font-bold text-lg text-gray-900">{category.name}</span>
          )}

          <span className="text-sm text-gray-400 shrink-0">{doneCount} / {tasks.length}</span>

          {isAdmin && !renaming && (
            <>
              <button
                onClick={() => { setShowAddForm(true); setOpen(true) }}
                className="p-1 rounded text-gray-400 hover:text-navy-700 hover:bg-cream-200"
                title="Aufgabe hinzufügen"
              >
                <Plus size={15} />
              </button>
              <button onClick={() => setRenaming(true)} className="p-1 rounded text-gray-400 hover:text-navy-700 hover:bg-cream-200">
                <Pencil size={13} />
              </button>
              {confirmDeleteCat ? (
                <span className="flex items-center gap-1 text-xs">
                  <span className="text-red-600 font-medium">Löschen?</span>
                  <button onClick={() => { onDelete(category.id); setConfirmDeleteCat(false) }} className="px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700">Ja</button>
                  <button onClick={() => setConfirmDeleteCat(false)} className="px-1.5 py-0.5 rounded border border-gray-300 text-gray-600">Nein</button>
                </span>
              ) : (
                <button onClick={() => setConfirmDeleteCat(true)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={13} />
                </button>
              )}
            </>
          )}
        </div>

        {open && (
          <div className="space-y-2 ml-6 mb-1">
            {visibleTasks.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">Keine Aufgaben</p>
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
          </div>
        )}
      </div>

      {showAddForm && (
        <TaskForm
          task={null}
          categoryId={category.id}
          users={users}
          currentUser={currentUser}
          onSave={handleCreateTask}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {editTask && (
        <TaskForm
          task={editTask}
          users={users}
          currentUser={currentUser}
          onSave={async changes => { await onUpdateTask(editTask.id, changes) }}
          onDelete={async () => { await onDeleteTask(editTask.id) }}
          onClose={() => setEditTask(null)}
        />
      )}
    </>
  )
}
