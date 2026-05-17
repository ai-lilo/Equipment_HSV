import { FileDown } from 'lucide-react'
import type { TournamentCategory, TournamentTask, TaskStatus } from '../../types/tournament'
import { exportChecklistPDF } from '../../lib/tournamentPdf'

interface Props {
  tournamentName: string
  categories: TournamentCategory[]
  tasks: TournamentTask[]
  onUpdateTask: (taskId: string, changes: Partial<Pick<TournamentTask, 'status'>>) => Promise<void>
}

const CHECKLIST_NAMES = [
  'aufbau: platz',
  'aufbau: parcours',
  'aufbau: vorbereitungsraum',
  'meldebüro: am veranstaltungstag',
  'küche: turniertag',
]

function isChecklistCategory(name: string): boolean {
  return CHECKLIST_NAMES.some(n => name.toLowerCase().includes(n))
}

export default function ChecklistTab({ tournamentName, categories, tasks, onUpdateTask }: Props) {
  const checklistCats = categories
    .filter(c => isChecklistCategory(c.name))
    .sort((a, b) => a.sort_order - b.sort_order)

  if (checklistCats.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <p className="text-sm">Keine Checklisten-Kategorien in diesem Turnier.</p>
        <p className="text-xs mt-1 opacity-70">Checklisten werden für die Kategorien Aufbau Platz, Aufbau Parcours, Aufbau Vorbereitungsraum, Meldebüro am Veranstaltungstag und Küche Turniertag erstellt.</p>
      </div>
    )
  }

  async function toggleTask(task: TournamentTask) {
    const newStatus: TaskStatus = task.status === 'abgeschlossen' ? 'nicht_begonnen' : 'abgeschlossen'
    await onUpdateTask(task.id, { status: newStatus })
  }

  function handlePrintAll() {
    const catTasks = tasks.filter(t => checklistCats.some(c => c.id === t.category_id))
    exportChecklistPDF(tournamentName, checklistCats, catTasks)
  }

  function handlePrintCategory(cat: TournamentCategory) {
    const catTasks = tasks.filter(t => t.category_id === cat.id)
    exportChecklistPDF(tournamentName, [cat], catTasks)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={handlePrintAll}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <FileDown size={16} /> Alle Checklisten drucken
        </button>
      </div>

      {checklistCats.map(cat => {
        const catTasks = tasks.filter(t => t.category_id === cat.id)
        const done = catTasks.filter(t => t.status === 'abgeschlossen').length
        const total = catTasks.length

        return (
          <div key={cat.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{cat.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{done}/{total} erledigt</p>
              </div>
              <button
                onClick={() => handlePrintCategory(cat)}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <FileDown size={13} /> Drucken
              </button>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {catTasks.map(task => {
                const checked = task.status === 'abgeschlossen'
                return (
                  <li key={task.id}>
                    <button
                      onClick={() => toggleTask(task)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <div className={`w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                        checked
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 dark:border-gray-500'
                      }`}>
                        {checked && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm ${checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {task.title}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
