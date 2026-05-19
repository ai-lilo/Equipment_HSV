import { Calendar } from 'lucide-react'
import type { TournamentTask, TournamentCategory } from '../../types/tournament'
import type { User } from '../../types'
import { isOverdue } from '../../hooks/useTournamentDetail'

interface Props {
  tasks: TournamentTask[]
  categories: TournamentCategory[]
  users: User[]
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  nicht_begonnen: { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Offen' },
  in_arbeit:      { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'In Arbeit' },
  abgeschlossen:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Erledigt' },
}

export default function TournamentTimeline({ tasks, categories, users }: Props) {
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const withDate = tasks
    .filter(t => t.due_date)
    .sort((a, b) => (a.due_date ?? '') < (b.due_date ?? '') ? -1 : 1)

  if (withDate.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Calendar size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Keine Aufgaben mit Zieldatum vorhanden.</p>
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
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-cream-200 rounded-full" />

      <div className="space-y-6">
        {Object.entries(groups).map(([date, dateTasks]) => {
          const d = new Date(date)
          const label = d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })

          return (
            <div key={date} className="relative">
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-navy-600 border-2 border-cream-50 z-10" />
              <p className="text-xs font-semibold text-navy-700 mb-2">{label}</p>

              <div className="space-y-2">
                {dateTasks.map(task => {
                  const overdue = isOverdue(task)
                  const badge = STATUS_BADGE[task.status] ?? STATUS_BADGE.nicht_begonnen
                  const responsible = task.responsible_user_id
                    ? users.find(u => u.id === task.responsible_user_id)?.username
                    : null

                  return (
                    <div key={task.id} className={`bg-white rounded-xl px-4 py-3 shadow-sm ${overdue ? 'border-l-4 border-red-400' : ''}`}>
                      <div className="flex items-start gap-3">
                        <span className={`shrink-0 mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${badge.bg} ${badge.text}`}>
                          {overdue ? 'Überfällig' : badge.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium text-gray-900 ${task.status === 'abgeschlossen' ? 'line-through text-gray-400' : ''}`}>
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{catMap[task.category_id] ?? '—'}</span>
                            {responsible && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{responsible}</span>
                            )}
                          </div>
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
