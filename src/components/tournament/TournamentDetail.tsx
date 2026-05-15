import { useState, useRef } from 'react'
import { ArrowLeft, Plus, FileDown, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import type { User } from '../../types'
import type { Tournament } from '../../types/tournament'
import { useTournamentDetail } from '../../hooks/useTournamentDetail'
import { useAllUsers } from '../../hooks/useAllUsers'
import DashboardTiles from './DashboardTiles'
import CategorySection from './CategorySection'
import NotesSection from './NotesSection'
import TournamentTimeline from './TournamentTimeline'
import { exportTournamentPDF } from '../../lib/tournamentPdf'

interface Props {
  tournament: Tournament
  currentUser: User
  onBack: () => void
  onArchive: (id: string) => Promise<void>
  onUnarchive: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onNavigateEquipment: () => void
}

type InnerTab = 'aufgaben' | 'notizen' | 'kalender'

export default function TournamentDetail({
  tournament, currentUser, onBack, onArchive, onUnarchive, onDelete, onNavigateEquipment
}: Props) {
  const isAdmin = currentUser.role === 'ADMIN'
  const { categories, tasks, note, bestPractices, loading, addCategory, renameCategory, deleteCategory, reorderCategories, addTask, updateTask, deleteTask, saveNote } = useTournamentDetail(tournament.id)
  const users = useAllUsers()

  const [innerTab, setInnerTab] = useState<InnerTab>('aufgaben')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const dragCatId = useRef<string | null>(null)

  function handleDragStart(_e: React.DragEvent, id: string) {
    dragCatId.current = id
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function handleDrop(_e: React.DragEvent, targetId: string) {
    const srcId = dragCatId.current
    if (!srcId || srcId === targetId) return
    const ids = categories.map(c => c.id)
    const srcIdx = ids.indexOf(srcId)
    const tgtIdx = ids.indexOf(targetId)
    const reordered = [...ids]
    reordered.splice(srcIdx, 1)
    reordered.splice(tgtIdx, 0, srcId)
    await reorderCategories(reordered)
    dragCatId.current = null
  }

  const dateStr = new Date(tournament.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
  const isArchived = tournament.archived

  const tabs: { key: InnerTab; label: string }[] = [
    { key: 'aufgaben', label: 'Aufgaben' },
    { key: 'notizen',  label: 'Notizen' },
    { key: 'kalender', label: 'Kalender' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back + Header */}
      <div className="flex items-start gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{tournament.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">📅 {dateStr}{isArchived ? ' · 📦 Archiviert' : ''}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isAdmin && (
            <>
              <button
                onClick={() => exportTournamentPDF(tournament, categories, tasks, users)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                title="PDF exportieren"
              >
                <FileDown size={16} />
                <span className="hidden sm:inline">PDF</span>
              </button>
              {isArchived ? (
                <button
                  onClick={() => onUnarchive(tournament.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Wiederherstellen"
                >
                  <ArchiveRestore size={16} />
                </button>
              ) : (
                <button
                  onClick={() => onArchive(tournament.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Archivieren"
                >
                  <Archive size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Inner tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setInnerTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              innerTab === tab.key
                ? 'border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AUFGABEN */}
      {innerTab === 'aufgaben' && (
        <>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Lädt...</div>
          ) : (
            <>
              <DashboardTiles tasks={tasks} activeFilter={statusFilter} onFilter={setStatusFilter} />

              <div className="space-y-3">
                {categories.map(cat => (
                  <CategorySection
                    key={cat.id}
                    category={cat}
                    tasks={tasks.filter(t => t.category_id === cat.id)}
                    users={users}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                    onAddTask={addTask}
                    onUpdateTask={updateTask}
                    onDeleteTask={deleteTask}
                    onRename={renameCategory}
                    onDelete={deleteCategory}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    statusFilter={statusFilter}
                    onNavigateEquipment={onNavigateEquipment}
                  />
                ))}

                {categories.length === 0 && (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <p className="text-sm">Noch keine Kategorien vorhanden.</p>
                    {isAdmin && <p className="text-xs mt-1">Füge unten eine Kategorie hinzu.</p>}
                  </div>
                )}

                {/* Add Category */}
                {isAdmin && (
                  <div className="mt-2">
                    {showNewCat ? (
                      <div className="flex gap-1.5">
                        <input
                          autoFocus
                          value={newCatName}
                          onChange={e => setNewCatName(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key === 'Enter' && newCatName.trim()) {
                              await addCategory(newCatName.trim())
                              setNewCatName('')
                              setShowNewCat(false)
                            }
                            if (e.key === 'Escape') { setShowNewCat(false); setNewCatName('') }
                          }}
                          placeholder="Kategoriename..."
                          className="flex-1 border border-blue-400 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={async () => {
                            if (!newCatName.trim()) return
                            await addCategory(newCatName.trim())
                            setNewCatName('')
                            setShowNewCat(false)
                          }}
                          className="px-4 py-2 rounded-lg bg-blue-800 text-white text-sm hover:bg-blue-900"
                        >
                          OK
                        </button>
                        <button onClick={() => { setShowNewCat(false); setNewCatName('') }} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewCat(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 w-full justify-center hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <Plus size={16} /> Kategorie hinzufügen
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Danger zone for admin */}
              {isAdmin && (
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {confirmDelete ? (
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-700">
                      <p className="text-sm text-red-700 dark:text-red-300 flex-1">Turnier wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
                      <button onClick={() => onDelete(tournament.id)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Löschen</button>
                      <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">Abbrechen</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                      <Trash2 size={13} /> Turnier löschen
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* NOTIZEN */}
      {innerTab === 'notizen' && (
        <NotesSection
          note={note}
          bestPractices={bestPractices}
          isAdmin={isAdmin}
          onSaveNote={saveNote}
        />
      )}

      {/* KALENDER */}
      {innerTab === 'kalender' && (
        loading ? (
          <div className="text-center py-8 text-gray-400">Lädt...</div>
        ) : (
          <TournamentTimeline tasks={tasks} categories={categories} users={users} />
        )
      )}
    </div>
  )
}
