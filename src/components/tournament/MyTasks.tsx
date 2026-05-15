import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { User } from '../../types'
import type { TournamentTask, TournamentCategory, Tournament } from '../../types/tournament'
import { isOverdue } from '../../hooks/useTournamentDetail'

interface Props {
  currentUser: User
}

interface TaskWithContext extends TournamentTask {
  categoryName: string
  tournamentName: string
}

export default function MyTasks({ currentUser }: Props) {
  const [tasks, setTasks] = useState<TaskWithContext[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [tasksRes, catsRes, tournamentsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('responsible_user_id', currentUser.id)
          .neq('status', 'abgeschlossen'),
        supabase.from('tournament_categories').select('*'),
        supabase.from('tournaments').select('*').eq('is_template', false),
      ])

      const allTasks = (tasksRes.data ?? []) as TournamentTask[]
      const allCats = (catsRes.data ?? []) as TournamentCategory[]
      const allTournaments = (tournamentsRes.data ?? []) as Tournament[]

      const catMap = Object.fromEntries(allCats.map(c => [c.id, c]))
      const tourMap = Object.fromEntries(allTournaments.map(t => [t.id, t.name]))

      const enriched: TaskWithContext[] = allTasks
        .map(t => ({
          ...t,
          categoryName: catMap[t.category_id]?.name ?? '—',
          tournamentName: tourMap[catMap[t.category_id]?.tournament_id ?? ''] ?? '—',
        }))
        .sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return a.due_date < b.due_date ? -1 : 1
        })

      setTasks(enriched)
      setLoading(false)
    }
    load()
  }, [currentUser.id])

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Lädt...</div>
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p className="text-2xl mb-2">✅</p>
        <p className="text-sm">Keine offenen Aufgaben für dich.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">{tasks.length} offene Aufgabe{tasks.length !== 1 ? 'n' : ''}</p>
      {tasks.map(task => {
        const overdue = isOverdue(task)
        const daysUntilDue = task.due_date
          ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000)
          : null
        const urgent = daysUntilDue !== null && daysUntilDue <= 3 && !overdue

        const borderCls = overdue
          ? 'border-red-400 bg-red-50 dark:bg-red-950/20 dark:border-red-600'
          : urgent
            ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-600'
            : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'

        return (
          <div key={task.id} className={`border rounded-xl px-4 py-3 ${borderCls}`}>
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {task.tournamentName} · {task.categoryName}
                </p>
              </div>
              {overdue && <span className="shrink-0 text-xs font-bold text-red-600 dark:text-red-400">🔴 Überfällig</span>}
              {urgent && !overdue && <span className="shrink-0 text-xs font-bold text-orange-600 dark:text-orange-400">⚠️ Bald fällig</span>}
            </div>
            {task.due_date && (
              <p className={`text-xs mt-1 ${overdue ? 'text-red-600 dark:text-red-400' : urgent ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
                📅 {new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                {daysUntilDue !== null && !overdue && ` (in ${daysUntilDue} Tag${daysUntilDue !== 1 ? 'en' : ''})`}
              </p>
            )}
            {task.notes && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">📝 {task.notes}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
