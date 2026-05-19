import { useState } from 'react'
import { Plus, Trophy, Archive, ChevronDown, ChevronRight, RotateCcw, FileText, Calendar } from 'lucide-react'
import type { User } from '../types'
import type { Tournament } from '../types/tournament'
import { useTournaments } from '../hooks/useTournaments'
import TournamentForm from '../components/tournament/TournamentForm'
import TournamentDetail from '../components/tournament/TournamentDetail'
import MyTasks from '../components/tournament/MyTasks'

interface Props {
  user: User
  onNavigate: (page: string) => void
}

type MainTab = 'uebersicht' | 'meine'

export default function Tournament({ user, onNavigate }: Props) {
  const isAdmin = user.role === 'ADMIN' || user.role === 'MEMBER'
  const { tournaments, templates, loading, createTournament, updateTournament, archiveTournament, unarchiveTournament, deleteTournament, createTemplateFromTournament, replaceTemplate, restoreTemplate } = useTournaments()

  const [mainTab, setMainTab] = useState<MainTab>('uebersicht')
  const [showTemplates, setShowTemplates] = useState(false)
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const active = tournaments.filter(t => !t.archived)
  const archived = tournaments.filter(t => t.archived)
  const selected = tournaments.find(t => t.id === selectedId) ?? null

  const today = new Date().toISOString().split('T')[0]
  const upcoming = active.filter(t => t.date >= today).sort((a, b) => a.date < b.date ? -1 : 1)
  const past = active.filter(t => t.date < today).sort((a, b) => a.date > b.date ? -1 : 1)
  const sortedActive = [...upcoming, ...past]

  if (selected) {
    return (
      <TournamentDetail
        tournament={selected}
        currentUser={user}
        templates={templates}
        onBack={() => setSelectedId(null)}
        onArchive={async id => { await archiveTournament(id); setSelectedId(null) }}
        onUnarchive={async id => { await unarchiveTournament(id) }}
        onDelete={async id => { await deleteTournament(id); setSelectedId(null) }}
        onCreateTemplate={async (id, name) => { await createTemplateFromTournament(id, name) }}
        onReplaceTemplate={async (templateId, tournamentId) => { await replaceTemplate(templateId, tournamentId) }}
        onUpdateTournament={async (name, date) => { await updateTournament(selected!.id, name, date) }}
        onNavigateEquipment={() => onNavigate('dashboard')}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1">Veranstaltung</p>
        <h1 className="text-3xl font-bold text-navy-900" style={{ fontFamily: "'Lora', serif" }}>
          Aufgaben &amp; <em>Checklisten</em>
        </h1>
      </div>

      <div className="flex gap-1 mb-5 bg-cream-200 p-1 rounded-xl">
        {([['uebersicht', 'Übersicht'], ['meine', 'Meine Aufgaben']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              mainTab === key ? 'bg-white text-navy-800 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mainTab === 'uebersicht' && (
        <>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 text-white py-3 rounded-xl font-semibold transition-colors mb-5"
            >
              <Plus size={18} /> Veranstaltung anlegen
            </button>
          )}

          {loading ? (
            <p className="text-center text-gray-400 py-12">Lade…</p>
          ) : sortedActive.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <p>Noch keine aktiven Veranstaltungen.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedActive.map((t, i) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  onClick={() => setSelectedId(t.id)}
                  isNext={i === 0 && t.date >= today}
                />
              ))}
            </div>
          )}

          {archived.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowArchived(o => !o)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Archive size={15} />
                <span>Archivierte Turniere ({archived.length})</span>
              </button>
              {showArchived && (
                <div className="space-y-2 opacity-70">
                  {archived.map(t => (
                    <TournamentCard key={t.id} tournament={t} onClick={() => setSelectedId(t.id)} archived />
                  ))}
                </div>
              )}
            </div>
          )}

          {isAdmin && templates.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowTemplates(o => !o)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                {showTemplates ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <FileText size={15} />
                <span>Vorlagen ({templates.length})</span>
              </button>
              {showTemplates && (
                <div className="space-y-2">
                  {templates.map(tmpl => (
                    <div key={tmpl.id} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                      <FileText size={16} className="text-gray-400 shrink-0" />
                      <span className="flex-1 text-sm font-medium text-gray-800">{tmpl.name}</span>
                      {tmpl.previous_source_tournament_id && (
                        restoreConfirmId === tmpl.id ? (
                          <span className="flex items-center gap-2 text-xs">
                            <span className="text-gray-600">Wiederherstellen?</span>
                            <button onClick={async () => { await restoreTemplate(tmpl.id); setRestoreConfirmId(null) }} className="px-2 py-1 rounded bg-amber-500 text-white hover:bg-amber-600">Ja</button>
                            <button onClick={() => setRestoreConfirmId(null)} className="px-2 py-1 rounded border border-gray-300 text-gray-700">Nein</button>
                          </span>
                        ) : (
                          <button onClick={() => setRestoreConfirmId(tmpl.id)} className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 border border-amber-200 px-2 py-1 rounded-lg">
                            <RotateCcw size={12} /> Wiederherstellen
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {mainTab === 'meine' && <MyTasks currentUser={user} />}

      {showForm && (
        <TournamentForm
          templates={templates}
          onSave={async (name, date, templateId) => { await createTournament(name, date, templateId, user.id) }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function TournamentCard({ tournament, onClick, archived, isNext }: {
  tournament: Tournament
  onClick: () => void
  archived?: boolean
  isNext?: boolean
}) {
  const dateStr = new Date(tournament.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })

  if (archived) {
    return (
      <button onClick={onClick} className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3.5 hover:border-gray-300 transition-all group">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-500 text-sm truncate">{tournament.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Calendar size={11} /> {dateStr}</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 shrink-0" />
        </div>
      </button>
    )
  }

  return (
    <button onClick={onClick} className="w-full text-left bg-navy-700 hover:bg-navy-800 rounded-2xl p-5 transition-colors">
      {isNext && (
        <p className="text-xs font-semibold tracking-widest uppercase text-amber-400 mb-1">Nächstes Turnier</p>
      )}
      <h2 className="text-lg font-bold text-white leading-snug mb-3" style={{ fontFamily: "'Lora', serif" }}>
        {tournament.name}
      </h2>
      <p className="text-sm text-navy-200 flex items-center gap-1.5"><Calendar size={13} /> {dateStr}</p>
    </button>
  )
}
