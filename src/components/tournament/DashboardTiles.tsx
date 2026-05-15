import type { TournamentTask } from '../../types/tournament'
import { isOverdue } from '../../hooks/useTournamentDetail'

interface Props {
  tasks: TournamentTask[]
  activeFilter: string | null
  onFilter: (f: string | null) => void
}

export default function DashboardTiles({ tasks, activeFilter, onFilter }: Props) {
  const counts = {
    nicht_begonnen: tasks.filter(t => t.status === 'nicht_begonnen' && !isOverdue(t)).length,
    in_arbeit: tasks.filter(t => t.status === 'in_arbeit' && !isOverdue(t)).length,
    abgeschlossen: tasks.filter(t => t.status === 'abgeschlossen').length,
    ueberfaellig: tasks.filter(t => isOverdue(t)).length,
  }

  const tiles = [
    { key: 'nicht_begonnen', label: 'Nicht begonnen', count: counts.nicht_begonnen, bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-200', border: 'border-gray-300 dark:border-gray-600', emoji: '⚪' },
    { key: 'in_arbeit',      label: 'In Arbeit',       count: counts.in_arbeit,      bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-300 dark:border-yellow-700', emoji: '🟡' },
    { key: 'abgeschlossen',  label: 'Abgeschlossen',   count: counts.abgeschlossen,  bg: 'bg-green-50 dark:bg-green-900/30',  text: 'text-green-800 dark:text-green-200',  border: 'border-green-300 dark:border-green-700',  emoji: '✅' },
    { key: 'ueberfaellig',   label: 'Überfällig',      count: counts.ueberfaellig,   bg: 'bg-red-50 dark:bg-red-900/30',      text: 'text-red-800 dark:text-red-200',      border: 'border-red-300 dark:border-red-700',      emoji: '🔴' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {tiles.map(tile => (
        <button
          key={tile.key}
          onClick={() => onFilter(activeFilter === tile.key ? null : tile.key)}
          className={`rounded-xl border-2 p-3 text-center transition-all ${tile.bg} ${tile.border} ${
            activeFilter === tile.key ? 'ring-2 ring-offset-1 ring-blue-500' : 'hover:opacity-80'
          }`}
        >
          <div className="text-2xl font-bold">{tile.count}</div>
          <div className={`text-xs font-medium mt-0.5 ${tile.text}`}>{tile.emoji} {tile.label}</div>
        </button>
      ))}
    </div>
  )
}
