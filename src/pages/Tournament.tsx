import { useState } from 'react'
import { Plus, Trophy, Archive, ChevronDown, ChevronRight, RotateCcw, FileText } from 'lucide-react'
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
  const { tournaments, templates, loading, createTournament, archiveTournament, unarchiveTournament, deleteTournament, createTemplateFromTournament, replaceTemplate, restoreTemplate } = useTournaments()

  const [mainTab, setMainTab] = useState<MainTab>('uebersicht')
  const [showTemplates, setShowTemplates] = useState(false)
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const active = tournaments.filter(t => !t.archived)
  const archived = tournaments.filter(t => t.archived)

  const selected = tournaments.find(t => t.id === selectedId) ?? null

  function handleNavigateEquipment() {
    onNavigate('dashboard')
  }

  // ── Detail view ──────────────────────────────────────────────────────
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
        onNavigateEquipment={handleNavigateEquipment}
      />
    )
  }

  // ── List view ────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={24} className="text-navy-700 shrink-0" />
        <h1 className="text-xl font-bold text-gray-900">Veranstaltungs-Organisation</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-700 text-white text-sm hover:bg-navy-800"
          >
            <Plus size={16} /> Veranstaltung anlegen
          </button>
        )}
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 dark:border-gray-700">
        {([['uebersicht', 'Übersicht'], ['meine', 'Meine Aufgaben']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              mainTab === key
                ? 'border-navy-700 text-navy-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ÜBERSICHT */}
      {mainTab === 'uebersicht' && (
        <>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Lädt...</div>
          ) : (
            <>
              {/* Active tournaments */}
              {active.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Noch keine aktiven Veranstaltungen.</p>
                  {isAdmin && <p className="text-xs mt-1">Klicke auf "Veranstaltung anlegen" um zu beginnen.</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {active.map(t => (
                    <TournamentCard key={t.id} tournament={t} onClick={() => setSelectedId(t.id)} />
                  ))}
                </div>
              )}

              {/* Archived toggle */}
              {archived.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowArchived(o => !o)}
                    className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Archive size={15} />
                    <span>Archivierte Turniere ({archived.length})</span>
                  </button>
                  {showArchived && (
                    <div className="mt-3 space-y-2 opacity-70">
                      {archived.map(t => (
                        <TournamentCard key={t.id} tournament={t} onClick={() => setSelectedId(t.id)} archived />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* VORLAGEN-PANEL (nur Admin/Vorstandschaft, nur wenn Templates vorhanden) */}
      {mainTab === 'uebersicht' && isAdmin && templates.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowTemplates(o => !o)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {showTemplates ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <FileText size={15} />
            <span>Vorlagen ({templates.length})</span>
          </button>
          {showTemplates && (
            <div className="mt-3 space-y-2">
              {templates.map(tmpl => (
                <div
                  key={tmpl.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <FileText size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-white">{tmpl.name}</span>
                  {tmpl.previous_source_tournament_id && (
                    restoreConfirmId === tmpl.id ? (
                      <span className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 dark:text-gray-300">Wirklich wiederherstellen?</span>
                        <button
                          onClick={async () => { await restoreTemplate(tmpl.id); setRestoreConfirmId(null) }}
                          className="px-2 py-1 rounded bg-orange-600 text-white hover:bg-orange-700"
                        >Ja</button>
                        <button
                          onClick={() => setRestoreConfirmId(null)}
                          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >Nein</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setRestoreConfirmId(tmpl.id)}
                        className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 border border-orange-200 dark:border-orange-700 px-2 py-1 rounded-lg"
                        title="Vorherige Vorlage wiederherstellen"
                      >
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

      {/* MEINE AUFGABEN */}
      {mainTab === 'meine' && (
        <MyTasks currentUser={user} />
      )}

      {/* Create form */}
      {showForm && (
        <TournamentForm
          templates={templates}
          onSave={async (name, date, templateId) => {
            await createTournament(name, date, templateId, user.id)
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function TournamentCard({ tournament, onClick, archived }: { tournament: Tournament; onClick: () => void; archived?: boolean }) {
  const dateStr = new Date(tournament.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3.5 hover:border-navy-200 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full shrink-0 ${archived ? 'bg-gray-300' : 'bg-navy-600'}`} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm group-hover:text-navy-700 truncate">
            {tournament.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">📅 {dateStr}</p>
        </div>
        <ChevronRight size={16} className="text-gray-400 group-hover:text-navy-600 shrink-0" />
      </div>
    </button>
  )
}
