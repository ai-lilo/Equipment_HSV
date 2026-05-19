import { Pencil, Calendar } from 'lucide-react'
import type { User } from '../../types'
import type { TournamentTask, TaskStatus } from '../../types/tournament'
import { isOverdue } from '../../hooks/useTournamentDetail'
import EquipmentLinker from './EquipmentLinker'

interface Props {
  task: TournamentTask
  users: User[]
  currentUser: User
  onEdit: (task: TournamentTask) => void
  onStatusChange: (id: string, status: TaskStatus) => void
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  nicht_begonnen: 'bg-gray-100 text-gray-600',
  in_arbeit:      'bg-amber-100 text-amber-700',
  abgeschlossen:  'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  nicht_begonnen: 'Offen',
  in_arbeit:      'In Arbeit',
  abgeschlossen:  'Erledigt',
}

const STATUS_CYCLE: Record<TaskStatus, TaskStatus> = {
  nicht_begonnen: 'in_arbeit',
  in_arbeit:      'abgeschlossen',
  abgeschlossen:  'nicht_begonnen',
}

export default function TaskCard({ task, users, currentUser, onEdit, onStatusChange }: Props) {
  const overdue = isOverdue(task)
  const canEdit = currentUser.role === 'ADMIN' || currentUser.role === 'MEMBER'

  const responsible = task.responsible_user_id
    ? users.find(u => u.id === task.responsible_user_id)?.username
    : null

  const dueDateStr = task.due_date
    ? new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  const daysUntilDue = task.due_date && task.status !== 'abgeschlossen'
    ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className={`bg-white rounded-xl shadow-sm px-4 py-3 ${overdue ? 'border-l-4 border-red-400' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => canEdit && onStatusChange(task.id, STATUS_CYCLE[task.status])}
          disabled={!canEdit}
          className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${STATUS_COLORS[task.status]} ${canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        >
          {STATUS_LABELS[task.status]}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-900 ${task.status === 'abgeschlossen' ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {responsible && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{responsible}</span>
            )}
            {dueDateStr && (
              <span className={`text-xs flex items-center gap-0.5 ${overdue ? 'text-red-500 font-medium' : daysUntilDue !== null && daysUntilDue <= 3 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                <Calendar size={10} /> {dueDateStr}
              </span>
            )}
            {task.notes && (
              <span className="text-xs text-gray-400 truncate">· {task.notes}</span>
            )}
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => onEdit(task)}
            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-navy-700 hover:bg-cream-200 transition-colors"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      <EquipmentLinker taskId={task.id} readOnly={true} />
    </div>
  )
}
