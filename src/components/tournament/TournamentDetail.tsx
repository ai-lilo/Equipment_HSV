import { useState, useRef } from 'react'
import { ArrowLeft, Plus, FileDown, Archive, ArchiveRestore, Trash2, Calendar, Pencil } from 'lucide-react'
import type { User } from '../../types'
import type { Tournament, TournamentTemplate, TournamentTask } from '../../types/tournament'
import { useTournamentDetail, isOverdue } from '../../hooks/useTournamentDetail'
import { useAllUsers } from '../../hooks/useAllUsers'
import { useClubMembers } from '../../hooks/useClubMembers'
import DashboardTiles from './DashboardTiles'
import CategorySection from './CategorySection'
import NotesSection from './NotesSection'
import TournamentTimeline from './TournamentTimeline'
import ChecklistTab from './ChecklistTab'
import HelferTab from './HelferTab'
import TaskForm from './TaskForm'
import TournamentForm from './TournamentForm'
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
  onUpdateTournament: (name: string, date: string) => Promise<void>
  onNavigateEquipment: () => void
}

type InnerTab = 'aufgaben' | 'checklisten' | 'helfer' | 'meine' | 'notizen' | 'kalender'
type ArchiveStep = 'choice' | 'new-name' | 'replace-pick' | 'replace-confirm'

export default function TournamentDetail({
  tournament, currentUser, templates, onBack, onArchive, onUnarchive, onDelete, onCreateTemplate, onReplaceTemplate, onUpdateTournament, onNavigateEquipment
}: Props) {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'MEMBER'
  const { categories, tasks, helpers, note, bestPractices, loading, addCategory, addChecklistCategory, renameCategory, deleteCategory, reorderCategories, addTask, updateTask, deleteTask, addHelper, updateHelper, deleteHelper, reorderHelpers, saveNote } = useTournamentDetail(tournament.id)
  const users = useAllUsers()
  const { members } = useClubMembers()

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
  const [myTaskEdit, setMyTaskEdit] = useState<TournamentTask | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)

  const dragCatId = useRef<string | null>(null)

  function handleDragStart(_e: React.DragEvent, id: string) { dragCatId.current = id }
  function handleDragOver(e: React.DragEvent) { e.preventDefault() }
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

  const dateStr = new Date(tournament.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })
  const isArchived = tournament.archived

  const doneCount = aufgabenTasks.filter(t => t.status === 'abgeschlossen').length
  const totalCount = aufgabenTasks.length
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const tabs: { key: InnerTab; label: string }[] = [
    { key: 'aufgaben',    label: 'Aufgaben' },
    { key: 'checklisten', label: 'Checklisten' },
    { key: 'helfer',      label: 'Helfer' },
    { key: 'meine',       label: 'Meine Aufgaben' },
    { key: 'notizen',     label: 'Notizen' },
    { key: 'kalender',    label: 'Kalender' },
  ]

  async function handlePdfExport() {
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
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="p-2 rounded-xl text-gray-500 hover:bg-cream-200 shrink-0">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1" />
        {isAdmin && (
          <>
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50"
            >
              <FileDown size={16} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            {isArchived ? (
              <button
                onClick={() => onUnarchive(tournament.id)}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                title="Wiederherstellen"
              >
                <ArchiveRestore size={16} />
              </button>
            ) : (
              <button
                onClick={() => { setTemplateName(tournament.name); setArchiveStep('choice'); setArchiveDialog(true) }}
                className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                title="Archivieren"
              >
                <Archive size={16} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Hero card */}
      <div className="bg-navy-700 rounded-2xl p-5 mb-5">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-widest uppercase text-amber-400 mb-1">Veranstaltung</p>
            <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Lora', serif" }}>
              {tournament.name}
            </h1>
            <p className="text-sm text-navy-200 flex items-center gap-1.5">
              <Calendar size={13} />
              {dateStr}
              {isArchived && <span className="ml-2 text-xs bg-navy-600 text-navy-200 px-2 py-0.5 rounded-full">Archiviert</span>}
            </p>
          </div>
          {isAdmin && !isArchived && (
            <button
              onClick={() => setShowEditForm(true)}
              className="shrink-0 p-2 rounded-xl border border-navy-600 text-navy-200 hover:bg-navy-600 transition-colors"
              title="Veranstaltung bearbeiten"
            >
              <Pencil size={15} />
            </button>
          )}
        </div>
        {!loading && totalCount > 0 && (
          <div className="mt-4">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-2xl font-bold text-white">{doneCount}</span>
              <span className="text-sm text-navy-200">/{totalCount} Aufgaben</span>
            </div>
            <div className="h-1.5 bg-navy-600 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Inner tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setInnerTab(tab.key)}
            className={`shrink-0 px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              innerTab === tab.key
                ? 'bg-navy-700 text-white'
                : 'bg-cream-200 text-gray-600 hover:bg-cream-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AUFGABEN */}
      {innerTab === 'aufgaben' && (
        loading ? (
          <p className="text-center text-gray-400 py-8">Lädt…</p>
        ) : (
          <>
            <DashboardTiles tasks={aufgabenTasks} activeFilter={statusFilter} onFilter={setStatusFilter} />

            <div className="space-y-4">
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
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Noch keine Kategorien vorhanden.</p>
                  {isAdmin && <p className="text-xs mt-1">Füge unten eine Kategorie hinzu.</p>}
                </div>
              )}

              {isAdmin && (
                <div className="mt-2">
                  {showNewCat ? (
                    <div className="flex gap-1.5">
                      <input
                        autoFocus
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        onKeyDown={async e => {
                          if (e.key === 'Enter' && newCatName.trim()) { await addCategory(newCatName.trim()); setNewCatName(''); setShowNewCat(false) }
                          if (e.key === 'Escape') { setShowNewCat(false); setNewCatName('') }
                        }}
                        placeholder="Kategoriename..."
                        className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-navy-700"
                      />
                      <button
                        onClick={async () => { if (!newCatName.trim()) return; await addCategory(newCatName.trim()); setNewCatName(''); setShowNewCat(false) }}
                        className="px-4 py-2 rounded-xl bg-navy-700 text-white text-sm hover:bg-navy-800"
                      >OK</button>
                      <button onClick={() => { setShowNewCat(false); setNewCatName('') }} className="px-3 py-2 rounded-xl border border-gray-300 text-sm text-gray-600">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowNewCat(true)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-500 w-full justify-center hover:border-navy-600 hover:text-navy-700 transition-colors"
                    >
                      <Plus size={16} /> Kategorie hinzufügen
                    </button>
                  )}
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="mt-8 pt-4 border-t border-gray-200">
                {confirmDelete ? (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                    <p className="text-sm text-red-700 flex-1">Veranstaltung wirklich löschen? Nicht rückgängig machbar.</p>
                    <button onClick={() => onDelete(tournament.id)} className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700">Löschen</button>
                    <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm text-gray-700">Abbrechen</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700">
                    <Trash2 size={13} /> Veranstaltung löschen
                  </button>
                )}
              </div>
            )}
          </>
        )
      )}

      {/* CHECKLISTEN */}
      {innerTab === 'checklisten' && (
        loading ? (
          <p className="text-center text-gray-400 py-8">Lädt…</p>
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

      {/* HELFER */}
      {innerTab === 'helfer' && (
        loading ? (
          <p className="text-center text-gray-400 py-8">Lädt…</p>
        ) : (
          <HelferTab
            tournamentName={tournament.name}
            helpers={helpers}
            members={members}
            isAdmin={isAdmin}
            onAdd={addHelper}
            onUpdate={updateHelper}
            onDelete={deleteHelper}
            onReorder={reorderHelpers}
          />
        )
      )}

      {/* MEINE AUFGABEN */}
      {innerTab === 'meine' && (
        loading ? (
          <p className="text-center text-gray-400 py-8">Lädt…</p>
        ) : (() => {
          const myTasks = tasks.filter(t => t.responsible_user_id === currentUser.id && t.status !== 'abgeschlossen')
          if (myTasks.length === 0) {
            return (
              <div className="text-center py-12 text-gray-400">
                <p className="text-2xl mb-2">✅</p>
                <p className="text-sm">Keine offenen Aufgaben für dich in dieser Veranstaltung.</p>
              </div>
            )
          }
          return (
            <>
              <p className="text-xs text-gray-500 mb-3">{myTasks.length} offene Aufgabe{myTasks.length !== 1 ? 'n' : ''}</p>
              <div className="space-y-2">
                {myTasks.map(task => {
                  const overdue = isOverdue(task)
                  const daysUntilDue = task.due_date ? Math.ceil((new Date(task.due_date).getTime() - Date.now()) / 86400000) : null
                  const urgent = daysUntilDue !== null && daysUntilDue <= 3 && !overdue
                  const catName = categories.find(c => c.id === task.category_id)?.name ?? '—'

                  return (
                    <button
                      key={task.id}
                      onClick={() => setMyTaskEdit(task)}
                      className={`w-full text-left bg-white rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow ${overdue ? 'border-l-4 border-red-400' : urgent ? 'border-l-4 border-amber-400' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{catName}</p>
                        </div>
                        {overdue && <span className="shrink-0 text-xs font-bold text-red-500">Überfällig</span>}
                        {urgent && !overdue && <span className="shrink-0 text-xs font-bold text-amber-600">Bald fällig</span>}
                      </div>
                      {task.due_date && (
                        <p className={`text-xs mt-1 flex items-center gap-1 ${overdue ? 'text-red-500' : urgent ? 'text-amber-600' : 'text-gray-400'}`}>
                          <Calendar size={11} />
                          {new Date(task.due_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          {daysUntilDue !== null && !overdue && ` (in ${daysUntilDue} Tag${daysUntilDue !== 1 ? 'en' : ''})`}
                        </p>
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
          <p className="text-center text-gray-400 py-8">Lädt…</p>
        ) : (
          <TournamentTimeline tasks={tasks} categories={categories} users={users} />
        )
      )}

      {/* EDIT FORM */}
      {showEditForm && (
        <TournamentForm
          templates={templates}
          existing={{ name: tournament.name, date: tournament.date }}
          onSave={async (name, date) => {
            await onUpdateTournament(name, date)
            setShowEditForm(false)
          }}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {/* ARCHIVIEREN-DIALOG */}
      {archiveDialog && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl">
            {archiveStep === 'choice' && (
              <>
                <h3 className="text-base font-bold text-gray-900 mb-2">Veranstaltung archivieren</h3>
                <p className="text-sm text-gray-600 mb-4">Möchtest du diese Veranstaltung auch als Vorlage speichern?</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={async () => { setArchiving(true); await onArchive(tournament.id); setArchiveDialog(false); setArchiving(false) }}
                    disabled={archiving}
                    className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >Nur archivieren</button>
                  <button
                    onClick={() => setArchiveStep('new-name')}
                    className="px-4 py-2 rounded-xl bg-navy-700 text-white text-sm hover:bg-navy-800"
                  >Neue Vorlage anlegen</button>
                  {templates.length > 0 && (
                    <button
                      onClick={() => { setSelectedTemplateId(templates[0].id); setArchiveStep('replace-pick') }}
                      className="px-4 py-2 rounded-xl border border-amber-300 text-amber-700 text-sm hover:bg-amber-50"
                    >Bestehende Vorlage ersetzen</button>
                  )}
                  <button onClick={() => setArchiveDialog(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">Abbrechen</button>
                </div>
              </>
            )}

            {archiveStep === 'new-name' && (
              <>
                <h3 className="text-base font-bold text-gray-900 mb-2">Neue Vorlage anlegen</h3>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vorlagenname</label>
                <input
                  autoFocus
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setArchiveStep('choice')} className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700">Zurück</button>
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
                    className="px-4 py-2 rounded-xl bg-navy-700 text-white text-sm hover:bg-navy-800 disabled:opacity-50"
                  >{archiving ? 'Wird gespeichert…' : 'Anlegen & archivieren'}</button>
                </div>
              </>
            )}

            {archiveStep === 'replace-pick' && (
              <>
                <h3 className="text-base font-bold text-gray-900 mb-2">Vorlage ersetzen</h3>
                <label className="block text-xs font-medium text-gray-600 mb-1">Welche Vorlage ersetzen?</label>
                <select
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4"
                >
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setArchiveStep('choice')} className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700">Zurück</button>
                  <button onClick={() => setArchiveStep('replace-confirm')} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm hover:bg-amber-600">Weiter</button>
                </div>
              </>
            )}

            {archiveStep === 'replace-confirm' && (
              <>
                <h3 className="text-base font-bold text-gray-900 mb-2">Wirklich ersetzen?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Die Vorlage „{templates.find(t => t.id === selectedTemplateId)?.name}" wird überschrieben. Die vorherige Version kann anschließend wiederhergestellt werden.
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setArchiveStep('replace-pick')} className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700">Zurück</button>
                  <button
                    onClick={async () => {
                      setArchiving(true)
                      await onReplaceTemplate(selectedTemplateId, tournament.id)
                      await onArchive(tournament.id)
                      setArchiveDialog(false)
                      setArchiving(false)
                    }}
                    disabled={archiving}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm hover:bg-amber-600 disabled:opacity-50"
                  >{archiving ? 'Wird gespeichert…' : 'Ersetzen & archivieren'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
