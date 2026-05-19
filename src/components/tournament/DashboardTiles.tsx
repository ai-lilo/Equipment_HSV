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
    in_arbeit:      tasks.filter(t => t.status === 'in_arbeit' && !isOverdue(t)).length,
    abgeschlossen:  tasks.filter(t => t.status === 'abgeschlossen').length,
    ueberfaellig:   tasks.filter(t => isOverdue(t)).length,
  }

  const tiles = [
    { key: 'nicht_begonnen', label: 'Offen',      count: counts.nicht_begonnen, numCls: 'text-gray-800',   border: 'border-gray-200' },
    { key: 'in_arbeit',      label: 'In Arbeit',  count: counts.in_arbeit,      numCls: 'text-amber-600',  border: 'border-amber-200' },
    { key: 'abgeschlossen',  label: 'Erledigt',   count: counts.abgeschlossen,  numCls: 'text-green-600',  border: 'border-green-200' },
    { key: 'ueberfaellig',   label: 'Überfällig', count: counts.ueberfaellig,   numCls: 'text-red-500',    border: 'border-red-200' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {tiles.map(tile => (
        <button
          key={tile.key}
          onClick={() => onFilter(activeFilter === tile.key ? null : tile.key)}
          className={`bg-white rounded-xl border-2 ${tile.border} p-3 text-left transition-all ${
            activeFilter === tile.key ? 'ring-2 ring-navy-700 ring-offset-1' : 'hover:shadow-sm'
          }`}
        >
          <p className={`text-3xl font-bold ${tile.numCls}`}>{tile.count}</p>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{tile.label}</p>
        </button>
      ))}
    </div>
  )
}
