import { useState, useRef } from 'react'
import { ArrowLeft, Plus, FileDown, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import type { User } from '../../types'
import type { Tournament, TournamentTemplate, TournamentTask } from '../../types/tournament'
import { useTournamentDetail, isOverdue } from '../../hooks/useTournamentDetail'
import { useAllUsers } from '../../hooks/useAllUsers'
import DashboardTiles from './DashboardTiles'
import CategorySection from './CategorySection'
import NotesSection from './NotesSection'
import TournamentTimeline from './TournamentTimeline'
import ChecklistTab from './ChecklistTab'
import TaskForm from './TaskForm'
import { exportTournamentPDF, type TaskEquipmentEntry } from '../../lib/tournamentPdf'
import { supabase } from '../../lib/supabase'

interface Props {
  tournament: Tournament
  currentUser: User
  templates: TournamentTemplate[]
  onBack: () => void
  onArchive: (id: string) => Promise<void>
  onUnarchive: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onCreateTemplate: (tournamentId: string, name: string) => Promise<void>
  onReplaceTemplate: (templateId: string, tournamentId: string) => Promise<void>
  onNavigateEquipment: () => void
}

type InnerTab = 'aufgaben' | 'notizen' | 'kalender' | 'checklisten' | 'meine'
type ArchiveStep = 'choice' | 'new-name' | 'replace-pick' | 'replace-confirm'

export default function TournamentDetail({
  tournament, currentUser, templates, onBack, onArchive, onUnarchive, onDelete, onCreateTemplate, onReplaceTemplate, onNavigateEquipment
}: Props) {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'MEMBER'
  const { categories, tasks, note, bestPractices, loading, addCategory, addChecklistCategory, renameCategory, deleteCategory, reorderCategories, addTask, updateTask, deleteTask, saveNote } = useTournamentDetail(tournament.id)
  const users = useAllUsers()

  const taskCategories = categories.filter(c => !c.is_checklist)
  const taskCategoryIds = new Set(taskCategories.map(c => c.id))
  const aufgabenTasks = tasks.filter(t => taskCategoryIds.has(t.category_id))

  const [innerTab, setInnerTab] = useState<InnerTab>('aufgaben')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [archiveDialog, setArchiveDialog] = useState(false)
  const [archiveStep, setArchiveStep] = useState<ArchiveStep>('choice')
  const [templateName, setTemplateName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [archiving, setArchiving] = useState(false)

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
    const ids = taskCategories.map(c => c.id)
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

  const [myTaskEdit, setMyTaskEdit] = useState<TournamentTask | null>(null)

  const tabs: { key: InnerTab; label: string }[] = [
    { key: 'aufgaben',    label: 'Aufgaben' },
    { key: 'meine',       label: 'Meine Aufgaben' },
    { key: 'notizen',     label: 'Notizen' },
    { key: 'kalender',    label: 'Kalender' },
    { key: 'checklisten', label: 'Checklisten' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back + Header */}
      <div className="flex items-start gap-3 mb-4">
        <button onClick={onBack} className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0">
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
                onClick={async () => {
                  const { data } = await supabase
                    .from('task_equipment')
                    .select('task_id, equipment:equipment_id(name, room:room_id(name), cabinet:cabinet_id(name))')
                    .in('task_id', tasks.map(t => t.id))
                  const map: Record<string, TaskEquipmentEntry[]> = {}
                  for (const row of (data ?? []) as unknown as Array<{ task_id: string; equipment: { name: string; room?: { name: string } | null; cabinet?: { name: string } | null } }>) {
                    const loc = row.equipment.cabinet?.name
                      ? `${row.equipment.room?.name ?? ''} / ${row.equipment.cabinet.name}`
                      : (row.equipment.room?.name ?? '')
                    if (!map[row.task_id]) map[row.task_id] = []
                    map[row.task_id].push({ name: row.equipment.name, location: loc })
                  }
                  exportTournamentPDF(tournament, categories, tasks, users, map)
                }}
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
                  onClick={() => { setTemplateName(tournament.name); setArchiveStep('choice'); setArchiveDialog(true) }}
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
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">Lädt...</div>
          ) : (
            <>
              <DashboardTiles tasks={aufgabenTasks} activeFilter={statusFilter} onFilter={setStatusFilter} />

              <div className="space-y-3">
                {taskCategories.map(cat => (
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

                {taskCategories.length === 0 && (
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
                      <p className="text-sm text-red-700 dark:text-red-300 flex-1">Veranstaltung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
                      <button onClick={() => onDelete(tournament.id)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Löschen</button>
                      <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">Abbrechen</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                      <Trash2 size={13} /> Veranstaltung löschen
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
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">Lädt...</div>
        ) : (
          <TournamentTimeline tasks={tasks} categories={categories} users={users} />
        )
      )}

      {/* CHECKLISTEN */}
      {innerTab === 'checklisten' && (
        loading ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">Lädt...</div>
        ) : (
          <ChecklistTab
            tournamentName={tournament.name}
            categories={categories}
            tasks={tasks}
            isAdmin={isAdmin}
            onUpdateTask={updateTask}
            onAddTask={(catId, title) => addTask(catId, title, currentUser.id)}
            onDeleteTask={deleteTask}
            onRenameCategory={renameCategory}
            onDeleteCategory={deleteCategory}
            onAddChecklistCategory={addChecklistCategory}
          />
        )
      )}

      {/* MEINE AUFGABEN */}
      {innerTab === 'meine' && (
        loading ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">Lädt...</div>
        ) : (() => {
          const myTasks = tasks.filter(t => t.responsible_user_id === currentUser.id && t.status !== 'abgeschlossen')
          if (myTasks.length === 0) {
            return (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm">Keine offenen Aufgaben für dich in dieser Veranstaltung.</p>
              </div>
            )
          }
          return (
            <>
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{myTasks.length} offene Aufgabe{myTasks.length !== 1 ? 'n' : ''}</p>
                {myTasks.map(task => {
                  const overdue = isOverdue(task)
                  const daysUntilDue = task.due_date
                    ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000)
                    : null
                  const urgent = daysUntilDue !== null && daysUntilDue <= 3 && !overdue
                  const catName = categories.find(c => c.id === task.category_id)?.name ?? '—'

                  const borderCls = overdue
                    ? 'border-red-400 bg-red-50 dark:bg-red-950/20 dark:border-red-600'
                    : urgent
                      ? 'border-orange-300 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-600'
                      : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'

                  return (
                    <button
                      key={task.id}
                      onClick={() => setMyTaskEdit(task)}
                      className={`w-full text-left border rounded-xl px-4 py-3 ${borderCls} hover:shadow-sm transition-shadow`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{catName}</p>
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
                    </button>
                  )
                })}
              </div>
              {myTaskEdit && (
                <TaskForm
                  task={myTaskEdit}
                  users={users}
                  currentUser={currentUser}
                  onSave={async changes => { await updateTask(myTaskEdit.id, changes) }}
                  onClose={() => setMyTaskEdit(null)}
                  onNavigateEquipment={onNavigateEquipment}
                />
              )}
            </>
          )
        })()
      )}

      {/* ARCHIVIEREN-DIALOG */}
      {archiveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-5 shadow-xl">
            {archiveStep === 'choice' && (
              <>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Veranstaltung archivieren</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Möchtest du diese Veranstaltung auch als Vorlage speichern?</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={async () => { setArchiving(true); await onArchive(tournament.id); setArchiveDialog(false); setArchiving(false) }}
                    disabled={archiving}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Nur archivieren
                  </button>
                  <button
                    onClick={() => setArchiveStep('new-name')}
                    className="px-4 py-2 rounded-lg bg-blue-800 text-white text-sm hover:bg-blue-900"
                  >
                    Neue Vorlage anlegen
                  </button>
                  {templates.length > 0 && (
                    <button
                      onClick={() => { setSelectedTemplateId(templates[0].id); setArchiveStep('replace-pick') }}
                      className="px-4 py-2 rounded-lg border border-orange-300 text-orange-700 dark:text-orange-300 dark:border-orange-700 text-sm hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    >
                      Bestehende Vorlage ersetzen
                    </button>
                  )}
                  <button onClick={() => setArchiveDialog(false)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-1">Abbrechen</button>
                </div>
              </>
            )}

            {archiveStep === 'new-name' && (
              <>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Neue Vorlage anlegen</h3>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vorlagenname</label>
                <input
                  autoFocus
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setArchiveStep('choice')} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">Zurück</button>
                  <button
                    onClick={async () => {
                      if (!templateName.trim()) return
                      setArchiving(true)
                      await onCreateTemplate(tournament.id, templateName.trim())
                      await onArchive(tournament.id)
                      setArchiveDialog(false)
                      setArchiving(false)
                    }}
                    disabled={archiving || !templateName.trim()}
                    className="px-4 py-2 rounded-lg bg-blue-800 text-white text-sm hover:bg-blue-900 disabled:opacity-50"
                  >
                    {archiving ? 'Wird gespeichert…' : 'Anlegen & archivieren'}
                  </button>
                </div>
              </>
            )}

            {archiveStep === 'replace-pick' && (
              <>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Vorlage ersetzen</h3>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Welche Vorlage ersetzen?</label>
                <select
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white mb-4"
                >
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setArchiveStep('choice')} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">Zurück</button>
                  <button
                    onClick={() => setArchiveStep('replace-confirm')}
                    className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm hover:bg-orange-700"
                  >
                    Weiter
                  </button>
                </div>
              </>
            )}

            {archiveStep === 'replace-confirm' && (
              <>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Wirklich ersetzen?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Die Vorlage „{templates.find(t => t.id === selectedTemplateId)?.name}" wird überschrieben. Die vorherige Version kann anschließend im Vorlagen-Panel wiederhergestellt werden.
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setArchiveStep('replace-pick')} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">Zurück</button>
                  <button
                    onClick={async () => {
                      setArchiving(true)
                      await onReplaceTemplate(selectedTemplateId, tournament.id)
                      await onArchive(tournament.id)
                      setArchiveDialog(false)
                      setArchiving(false)
                    }}
                    disabled={archiving}
                    className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm hover:bg-orange-700 disabled:opacity-50"
                  >
                    {archiving ? 'Wird gespeichert…' : 'Ersetzen & archivieren'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
