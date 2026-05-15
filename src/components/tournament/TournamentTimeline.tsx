import type { TournamentTask, TournamentCategory } from '../../types/tournament'
import type { User } from '../../types'
import { isOverdue } from '../../hooks/useTournamentDetail'

interface Props {
  tasks: TournamentTask[]
  categories: TournamentCategory[]
  users: User[]
}

const STATUS_COLORS = {
  nicht_begonnen: 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
  in_arbeit:      'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
  abgeschlossen:  'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700',
}

const DOT_COLORS = {
  nicht_begonnen: 'bg-gray-400',
  in_arbeit:      'bg-yellow-400',
  abgeschlossen:  'bg-green-500',
}

export default function TournamentTimeline({ tasks, categories, users }: Props) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const withDate = tasks
    .filter(t => t.due_date)
    .sort((a, b) => (a.due_date ?? '') < (b.due_date ?? '') ? -1 : 1)

  if (withDate.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p className="text-lg">📅</p>
        <p className="mt-1 text-sm">Keine Aufgaben mit Zieldatum vorhanden.</p>
        <p className="text-xs mt-1">Weise Aufgaben ein Datum zu, um sie hier zu sehen.</p>
      </div>
    )
  }

  const groups = withDate.reduce<Record<string, TournamentTask[]>>((acc, t) => {
    const key = t.due_date!
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-6">
        {Object.entries(groups).map(([date, dateTasks]) => {
          const d = new Date(date)
          const label = d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })

          return (
            <div key={date} className="relative">
              {/* Dot */}
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 z-10" />

              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">{label}</p>

              <div className="space-y-1.5">
                {dateTasks.map(task => {
                  const overdue = isOverdue(task)
                  const borderColor = overdue
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700'
                    : STATUS_COLORS[task.status]
                  const dotColor = overdue ? 'bg-red-500' : DOT_COLORS[task.status]
                  const responsible = task.responsible_user_id
                    ? users.find(u => u.id === task.responsible_user_id)?.username
                    : null

                  return (
                    <div key={task.id} className={`border rounded-lg px-3 py-2 flex items-start gap-2.5 ${borderColor}`}>
                      <div className={`shrink-0 w-2.5 h-2.5 rounded-full mt-1 ${dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm text-gray-900 dark:text-white ${task.status === 'abgeschlossen' ? 'line-through opacity-60' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex flex-wrap gap-x-3 mt-0.5">
                          <span className="text-xs text-gray-400 dark:text-gray-500">{catMap[task.category_id] ?? '—'}</span>
                          {responsible && <span className="text-xs text-blue-600 dark:text-blue-400">👤 {responsible}</span>}
                          {overdue && <span className="text-xs text-red-600 dark:text-red-400 font-medium">Überfällig</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
