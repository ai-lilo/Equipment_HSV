import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { FileDown, Users, History, Tag, Pencil, Trash2, Check, X, DoorOpen, Shield } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import type { User, ChangeLog, Equipment, Room, Cabinet, Category } from '../types'
import Rooms from './Rooms'

interface Props {
  user: User
}

export default function Admin({ user }: Props) {
  const [tab, setTab] = useState<'users' | 'log' | 'pdf' | 'categories' | 'raeume' | 'datenschutz'>('users')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Admin</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>
          <Users size={16} /> Benutzer
        </TabBtn>
        <TabBtn active={tab === 'log'} onClick={() => setTab('log')}>
          <History size={16} /> Änderungshistorie
        </TabBtn>
        <TabBtn active={tab === 'pdf'} onClick={() => setTab('pdf')}>
          <FileDown size={16} /> PDF-Export
        </TabBtn>
        <TabBtn active={tab === 'categories'} onClick={() => setTab('categories')}>
          <Tag size={16} /> Kategorien
        </TabBtn>
        <TabBtn active={tab === 'raeume'} onClick={() => setTab('raeume')}>
          <DoorOpen size={16} /> Räume
        </TabBtn>
        <TabBtn active={tab === 'datenschutz'} onClick={() => setTab('datenschutz')}>
          <Shield size={16} /> Datenschutz
        </TabBtn>
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'log' && <LogTab />}
      {tab === 'pdf' && <PdfTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'raeume' && <Rooms user={user} />}
      {tab === 'datenschutz' && <DatenschutzTab />}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-blue-800 text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [newUsername, setNewUsername] = useState('')
  const [newRole, setNewRole] = useState<'VISITOR' | 'MEMBER' | 'ADMIN'>('MEMBER')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('users').select('*').order('username').then(({ data }) => {
      setUsers((data ?? []) as User[])
      setLoading(false)
    })
  }, [])

  async function addUser() {
    if (!newUsername.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('users')
      .insert({ username: newUsername.trim(), role: newRole })
      .select()
      .single()
    if (data) setUsers(prev => [...prev, data as User].sort((a, b) => a.username.localeCompare(b.username)))
    setNewUsername('')
    setSaving(false)
  }

  async function changeRole(userId: string, role: 'VISITOR' | 'MEMBER' | 'ADMIN') {
    await supabase.from('users').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
  }

  if (loading) return <p className="text-gray-400 dark:text-gray-500">Lade…</p>

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
          placeholder="Neuer Benutzername"
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <select
          value={newRole}
          onChange={e => setNewRole(e.target.value as 'VISITOR' | 'MEMBER' | 'ADMIN')}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="VISITOR">Mitglied</option>
          <option value="MEMBER">Vorstandschaft</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          onClick={addUser}
          disabled={saving || !newUsername.trim()}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          Hinzufügen
        </button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Benutzername</th>
              <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Rolle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map(u => (
              <tr key={u.id} className="bg-white dark:bg-gray-800">
                <td className="px-4 py-3 text-gray-900 dark:text-white">{u.username}</td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value as 'VISITOR' | 'MEMBER' | 'ADMIN')}
                    className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-xs text-gray-900 dark:text-white dark:bg-gray-700"
                  >
                    <option value="VISITOR">Besucher</option>
                    <option value="MEMBER">Mitglied</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">Benutzernamen können nur direkt in Supabase geändert werden.</p>

      {/* Rechteübersicht */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Rechteübersicht</h3>
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Funktion</th>
                <th className="text-center px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Mitglied</th>
                <th className="text-center px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Vorstandschaft</th>
                <th className="text-center px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {[
                ['Equipment einsehen',        true,  true,  true ],
                ['Veranstaltungen einsehen',  true,  true,  true ],
                ['Meine Aufgaben',            true,  true,  true ],
                ['Einkaufsliste',             false, true,  true ],
                ['Equipment bearbeiten',      false, true,  true ],
                ['Equipment löschen',         false, true,  true ],
                ['Veranstaltungen verwalten', false, true,  true ],
                ['Kategorien verwalten',      false, false, true ],
                ['Räume verwalten',           false, false, true ],
                ['Benutzer verwalten',        false, false, true ],
                ['Admin-Bereich',             false, false, true ],
              ].map(([label, visitor, member, admin]) => (
                <tr key={label as string} className="bg-white dark:bg-gray-800">
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-200">{label as string}</td>
                  {([visitor, member, admin] as boolean[]).map((allowed, i) => (
                    <td key={i} className="px-4 py-2.5 text-center">
                      {allowed
                        ? <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                        : <span className="text-gray-300 dark:text-gray-600">—</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LogTab() {
  const [logs, setLogs] = useState<ChangeLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('change_log')
      .select('*, equipment:equipment_id(name), user:user_id(username)')
      .order('changed_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setLogs((data ?? []) as ChangeLog[])
        setLoading(false)
      })
  }, [])

  const fieldLabel: Record<string, string> = {
    name: 'Name', count: 'Anzahl', room_id: 'Raum', cabinet_id: 'Schrank',
    sport: 'Sportart (alt)', category_id: 'Kategorie', status: 'Status', defect_note: 'Defekt-Notiz',
  }

  if (loading) return <p className="text-gray-400 dark:text-gray-500">Lade…</p>

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Zeitpunkt</th>
            <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Benutzer</th>
            <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Equipment</th>
            <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Feld</th>
            <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Änderung</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {logs.map(log => (
            <tr key={log.id} className="bg-white dark:bg-gray-800">
              <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {new Date(log.changed_at).toLocaleString('de-DE')}
              </td>
              <td className="px-4 py-2.5 text-gray-900 dark:text-white">{log.user?.username ?? '—'}</td>
              <td className="px-4 py-2.5 text-gray-900 dark:text-white">{log.equipment?.name ?? '—'}</td>
              <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{fieldLabel[log.field] ?? log.field}</td>
              <td className="px-4 py-2.5">
                <span className="text-red-500 line-through">{log.old_value ?? '—'}</span>
                {' → '}
                <span className="text-green-600 dark:text-green-400">{log.new_value ?? '—'}</span>
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={5} className="text-center text-gray-400 dark:text-gray-500 py-8">Keine Einträge</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function PdfTab() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [cabinets, setCabinets] = useState<Cabinet[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('equipment').select('*').order('name'),
      supabase.from('rooms').select('*').order('name'),
      supabase.from('cabinets').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ]).then(([e, r, c, cat]) => {
      setEquipment((e.data ?? []) as Equipment[])
      setRooms((r.data ?? []) as Room[])
      setCabinets((c.data ?? []) as Cabinet[])
      setCategories((cat.data ?? []) as Category[])
    })
  }, [])

  function roomName(id: string) { return rooms.find(r => r.id === id)?.name ?? id }
  function cabName(id: string | null) { return id ? (cabinets.find(c => c.id === id)?.name ?? '') : '' }
  function catName(id: string | null) { return id ? (categories.find(c => c.id === id)?.name ?? '') : '' }

  const statusLabel: Record<string, string> = { OK: 'OK', DEFECT: 'Defekt', IN_REPAIR: 'In Reparatur' }

  function handlePrint() {
    const win = window.open('', '_blank')
    if (!win || !printRef.current) return
    win.document.write(`
      <html><head><title>Inventarliste HSV Pegnitz</title>
      <style>
        body{font-family:sans-serif;padding:2rem;font-size:12px}
        h1{font-size:1.5rem;margin-bottom:1rem}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}
        th{background:#f3f4f6;font-weight:600}
        .defect{color:#dc2626} .repair{color:#d97706}
      </style></head>
      <body>${printRef.current.innerHTML}
      <script>window.onload=()=>{window.print();window.addEventListener('afterprint',()=>window.close())}</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div>
      <button
        onClick={handlePrint}
        className="mb-4 flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        <FileDown size={16} /> Als PDF drucken
      </button>

      <div ref={printRef}>
        <h1>Inventarliste HSV Pegnitz — {new Date().toLocaleDateString('de-DE')}</h1>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Anzahl</th>
              <th>Raum</th>
              <th>Schrank</th>
              <th>Kategorie</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map(e => (
              <tr key={e.id}>
                <td>{e.name}</td>
                <td>{e.count}</td>
                <td>{roomName(e.room_id)}</td>
                <td>{cabName(e.cabinet_id)}</td>
                <td>{catName(e.category_id)}</td>
                <td className={e.status === 'DEFECT' ? 'defect' : e.status === 'IN_REPAIR' ? 'repair' : ''}>
                  {statusLabel[e.status]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const inputCls = 'border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600'

function CategoriesTab() {
  const { categories, loading, addCategory, renameCategory, deleteCategory } = useCategories()
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    setError(null)
    const { error: err } = await addCategory(newName)
    if (err) setError(err)
    else setNewName('')
    setSaving(false)
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return
    setError(null)
    const { error: err } = await renameCategory(id, editingName)
    if (err) setError(err)
    else setEditingId(null)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Kategorie „${name}" wirklich löschen?`)) return
    setError(null)
    const { error: err } = await deleteCategory(id)
    if (err) setError(err)
  }

  if (loading) return <p className="text-gray-400 dark:text-gray-500">Lade…</p>

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Neue Kategorie"
          className={`flex-1 ${inputCls}`}
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newName.trim()}
          className="px-4 py-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          Hinzufügen
        </button>
      </div>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">Name</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {categories.map(cat => (
              <tr key={cat.id} className="bg-white dark:bg-gray-800">
                <td className="px-4 py-3">
                  {editingId === cat.id ? (
                    <input
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRename(cat.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                      className={inputCls}
                    />
                  ) : (
                    <span className="text-gray-900 dark:text-white">{cat.name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    {editingId === cat.id ? (
                      <>
                        <button onClick={() => handleRename(cat.id)} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded" title="Speichern">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Abbrechen">
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingId(cat.id); setEditingName(cat.name) }}
                          className="p-1.5 text-gray-400 hover:text-blue-700 dark:hover:text-blue-400 rounded"
                          title="Umbenennen"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          title="Löschen"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={2} className="text-center text-gray-400 dark:text-gray-500 py-6">Keine Kategorien vorhanden</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DatenschutzTab() {
  const sectionCls = 'mb-6'
  const h2Cls = 'text-base font-semibold text-gray-900 dark:text-white mb-2'
  const pCls = 'text-sm text-gray-700 dark:text-gray-300 leading-relaxed'
  const liCls = 'text-sm text-gray-700 dark:text-gray-300'

  return (
    <div className="max-w-2xl space-y-1">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Diese Datenschutzerklärung beschreibt, welche Daten in der Inventar-App des HSV Pegnitz gespeichert werden,
          wo sie liegen und wer Zugriff hat.
        </p>
      </div>

      <div className={sectionCls}>
        <h2 className={h2Cls}>Welche Daten werden gespeichert?</h2>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li className={liCls}><strong>Benutzerkonten:</strong> Benutzername und Rolle (Mitglied / Vorstandschaft / Admin)</li>
          <li className={liCls}><strong>Inventar:</strong> Equipment-Daten inkl. Name, Anzahl, Standort, Status und optionalem Foto</li>
          <li className={liCls}><strong>Veranstaltungen:</strong> Name, Datum, Aufgaben, Kategorien, Notizen, Best Practices und Vorlagen</li>
          <li className={liCls}><strong>Checklisten:</strong> Kategorien und Aufgaben mit Status (erledigt / offen)</li>
          <li className={liCls}><strong>Einkaufsliste:</strong> Einträge mit Bezug zum Equipment und zuständigem Benutzer</li>
          <li className={liCls}><strong>Änderungsprotokoll:</strong> Wer welches Equipment wann geändert hat (Feld, alter und neuer Wert)</li>
          <li className={liCls}><strong>Push-Benachrichtigungs-Abonnement:</strong> Browser-Push-Endpunkt (wird nur intern für Benachrichtigungen genutzt)</li>
        </ul>
      </div>

      <div className={sectionCls}>
        <h2 className={h2Cls}>Wo werden die Daten gespeichert?</h2>
        <p className={pCls}>
          Alle Daten werden in einer <strong>Supabase-Datenbank (PostgreSQL)</strong> gespeichert.
          Supabase betreibt seine EU-Infrastruktur in der Region <strong>Frankfurt (eu-central-1)</strong>.
          Das Frontend (diese App) wird als statische Seite über <strong>GitHub Pages</strong> bereitgestellt –
          dort werden keine Daten gespeichert.
        </p>
      </div>

      <div className={sectionCls}>
        <h2 className={h2Cls}>Wer hat Zugriff auf die Daten?</h2>
        <ul className="list-disc list-inside space-y-1 pl-1">
          <li className={liCls}><strong>Mitglieder</strong> können Inventar und Veranstaltungen einsehen</li>
          <li className={liCls}><strong>Vorstandschaft</strong> kann zusätzlich Inventar und Veranstaltungen verwalten sowie die Einkaufsliste nutzen</li>
          <li className={liCls}><strong>Admin</strong> hat vollen Zugriff einschließlich Benutzerverwaltung und Änderungsprotokoll</li>
          <li className={liCls}><strong>Supabase Inc.</strong> als Auftragsverarbeiter hat im Rahmen des Hostings technischen Zugriff auf die Infrastruktur</li>
        </ul>
      </div>

      <div className={sectionCls}>
        <h2 className={h2Cls}>Dritte und externe Dienste</h2>
        <p className={pCls}>
          Es werden <strong>keine Analyse- oder Tracking-Tools</strong> eingesetzt (kein Google Analytics, kein Meta, kein Hotjar o. Ä.).
          Der einzige externe Dienstleister ist <strong>Supabase Inc.</strong> (Datenbank und Push-Benachrichtigungen).
          Daten werden nicht an weitere Dritte weitergegeben oder verkauft.
        </p>
      </div>

      <div className={sectionCls}>
        <h2 className={h2Cls}>Push-Benachrichtigungen</h2>
        <p className={pCls}>
          Wenn Push-Benachrichtigungen aktiviert werden, speichert der Browser einen verschlüsselten Endpunkt-Token
          in der Datenbank. Dieser wird ausschließlich verwendet, um interne Benachrichtigungen zu senden
          (z. B. bei Defektmeldungen). Der Token kann jederzeit durch Deaktivierung von Browser-Push-Benachrichtigungen
          widerrufen werden.
        </p>
      </div>

      <div className={sectionCls}>
        <h2 className={h2Cls}>Datenlöschung</h2>
        <p className={pCls}>
          Benutzerkonten und zugehörige Daten können auf Anfrage von der Administratorin (Sabine Neupert)
          manuell gelöscht werden. Die App selbst bietet keine automatische Selbstlöschung.
        </p>
      </div>

      <div className={sectionCls}>
        <h2 className={h2Cls}>Sicherheit</h2>
        <p className={pCls}>
          Alle Datenübertragungen erfolgen verschlüsselt über <strong>HTTPS/TLS</strong>.
          Der Zugriff ist über ein Rollenmodell (Mitglied / Vorstandschaft / Admin) abgesichert.
          Die App ist nur für interne Vereinsmitglieder bestimmt – ein Benutzerkonto muss vom Admin angelegt werden.
        </p>
      </div>

      <div className={sectionCls}>
        <h2 className={h2Cls}>Kontakt</h2>
        <p className={pCls}>
          Bei Fragen zum Datenschutz oder zur Löschung von Daten wende dich an:<br />
          <strong>Sabine Neupert</strong> · <a href="mailto:neupert.sabine@outlook.com" className="text-blue-700 dark:text-blue-400 underline">neupert.sabine@outlook.com</a>
        </p>
      </div>
    </div>
  )
}
