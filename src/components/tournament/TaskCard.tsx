import { Pencil } from 'lucide-react'
import type { User } from '../../types'
import type { TournamentTask, TaskStatus } from '../../types/tournament'
import { isOverdue } from '../../hooks/useTournamentDetail'

interface Props {
  task: TournamentTask
  users: User[]
  currentUser: User
  onEdit: (task: TournamentTask) => void
  onStatusChange: (id: string, status: TaskStatus) => void
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  nicht_begonnen: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  in_arbeit:      'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200',
  abgeschlossen:  'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  nicht_begonnen: '⚪ Nicht begonnen',
  in_arbeit:      '🟡 In Arbeit',
  abgeschlossen:  '✅ Abgeschlossen',
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  nicht_begonnen: 'in_arbeit',
  in_arbeit:      'abgeschlossen',
  abgeschlossen:  'nicht_begonnen',
}

export default function TaskCard({ task, users, currentUser, onEdit, onStatusChange }: Props) {
  const overdue = isOverdue(task)
  const canEdit = currentUser.role === 'ADMIN' ||
    (currentUser.role === 'MEMBER' && task.responsible_user_id === currentUser.id)

  const responsible = task.responsible_user_id
    ? users.find(u => u.id === task.responsible_user_id)?.username
    : null

  const dueDateStr = task.due_date
    ? new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  const daysUntilDue = task.due_date && task.status !== 'abgeschlossen'
    ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000)
    : null

  const borderCls = overdue
    ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-950/20'
    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'

  return (
    <div className={`border rounded-lg px-3 py-2.5 flex items-start gap-2.5 ${borderCls}`}>
      {/* Status-Toggle */}
      <button
        onClick={() => canEdit && onStatusChange(task.id, STATUS_CYCLE[task.status])}
        disabled={!canEdit}
        title={canEdit ? 'Status wechseln' : undefined}
        className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${STATUS_COLORS[task.status]} ${canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
      >
        {STATUS_LABELS[task.status]}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm text-gray-900 dark:text-white ${task.status === 'abgeschlossen' ? 'line-through opacity-60' : ''}`}>
          {task.title}
        </p>
        <div className="flex flex-wrap gap-x-3 mt-0.5">
          {responsible && (
            <span className="text-xs text-blue-600 dark:text-blue-400">👤 {responsible}</span>
          )}
          {dueDateStr && (
            <span className={`text-xs ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : daysUntilDue !== null && daysUntilDue <= 3 ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
              📅 {dueDateStr}{overdue ? ' (überfällig)' : daysUntilDue !== null && daysUntilDue <= 3 ? ` (${daysUntilDue}d)` : ''}
            </span>
          )}
          {task.notes && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">📝 {task.notes}</span>
          )}
        </div>
      </div>

      {/* Edit */}
      {canEdit && (
        <button
          onClick={() => onEdit(task)}
          className="shrink-0 p-1 rounded text-gray-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  )
}
