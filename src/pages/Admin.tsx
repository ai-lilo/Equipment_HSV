import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { FileDown, History, Tag, Pencil, Trash2, Check, X, Shield, Plus, Users } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { useClubMembers } from '../hooks/useClubMembers'
import type { User, ChangeLog, Equipment, Room, Cabinet, Category } from '../types'
import Rooms from './Rooms'

interface Props {
  user: User
}

function initials(name: string) {
  return name.split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('')
}

type Tab = 'users' | 'raeume' | 'log' | 'pdf' | 'categories' | 'datenschutz' | 'mitglieder'

export default function Admin({ user }: Props) {
  const [tab, setTab] = useState<Tab>('users')
  const [userCount, setUserCount] = useState(0)
  const [roomCount, setRoomCount] = useState(0)
  const [cabinetCount, setCabinetCount] = useState(0)

  useEffect(() => {
    Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('rooms').select('id', { count: 'exact', head: true }),
      supabase.from('cabinets').select('id', { count: 'exact', head: true }),
    ]).then(([u, r, c]) => {
      setUserCount(u.count ?? 0)
      setRoomCount(r.count ?? 0)
      setCabinetCount(c.count ?? 0)
    })
  }, [])

  const primaryTabs: { key: Tab; label: string; count: number }[] = [
    { key: 'users',  label: 'Benutzer:innen', count: userCount },
    { key: 'raeume', label: 'Räume',           count: roomCount },
    { key: 'raeume', label: 'Schränke',        count: cabinetCount },
  ]

  const secondaryTabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'mitglieder', label: 'Mitglieder & Stunden', icon: <Users size={13} /> },
    { key: 'log',        label: 'Änderungshistorie',    icon: <History size={13} /> },
    { key: 'pdf',        label: 'PDF-Export',           icon: <FileDown size={13} /> },
    { key: 'categories', label: 'Kategorien',           icon: <Tag size={13} /> },
    { key: 'datenschutz',label: 'Datenschutz',          icon: <Shield size={13} /> },
  ]

  const isPrimary = tab === 'users' || tab === 'raeume'

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      {/* Hero */}
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-1">Admin-Bereich</p>
        <h1 className="text-3xl font-bold text-navy-900" style={{ fontFamily: "'Lora', serif" }}>
          Verein <em>verwalten</em>
        </h1>
      </div>

      {/* Primary tabs */}
      <div className="flex gap-6 mb-5">
        {primaryTabs.map(({ key, label, count }) => {
          const active = tab === key && isPrimary
          return (
            <button
              key={label}
              onClick={() => setTab(key)}
              className={`text-sm transition-colors ${
                active
                  ? 'text-navy-900 font-bold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {label} <span className={active ? 'text-navy-700' : ''}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Secondary nav */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {secondaryTabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              tab === key
                ? 'text-navy-700 font-semibold'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === 'users'       && <UsersTab />}
      {tab === 'raeume'      && <Rooms user={user} />}
      {tab === 'mitglieder'  && <MitgliederTab />}
      {tab === 'log'         && <LogTab />}
      {tab === 'pdf'         && <PdfTab />}
      {tab === 'categories'  && <CategoriesTab />}
      {tab === 'datenschutz' && <DatenschutzTab />}
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newRole, setNewRole] = useState<'VISITOR' | 'MEMBER' | 'ADMIN'>('VISITOR')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingRole, setEditingRole] = useState<'VISITOR' | 'MEMBER' | 'ADMIN'>('VISITOR')

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
    setShowForm(false)
    setSaving(false)
  }

  async function saveRole(userId: string) {
    await supabase.from('users').update({ role: editingRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: editingRole } : u))
    setEditingId(null)
  }

  async function deleteUser(userId: string, username: string) {
    if (!confirm(`Benutzer:in „${username}" wirklich löschen?`)) return
    await supabase.from('users').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
  }

  if (loading) return <p className="text-gray-400">Lade…</p>

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowForm(o => !o)}
        className="w-full flex items-center justify-center gap-2 bg-navy-700 hover:bg-navy-800 text-white py-3.5 rounded-xl font-semibold transition-colors"
      >
        <Plus size={18} /> Benutzer:in anlegen
      </button>

      {showForm && (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <input
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addUser()}
            placeholder="Benutzername"
            className="w-full rounded-xl px-4 py-3 bg-cream-100 border-0 text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-700 text-sm"
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value as 'VISITOR' | 'MEMBER' | 'ADMIN')}
            className="w-full rounded-xl px-4 py-3 bg-cream-100 border-0 text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-700 text-sm"
          >
            <option value="VISITOR">Mitglied</option>
            <option value="MEMBER">Vorstandschaft</option>
            <option value="ADMIN">Admin</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={addUser}
              disabled={saving || !newUsername.trim()}
              className="flex-1 py-2.5 rounded-xl bg-navy-700 hover:bg-navy-800 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
            >
              Anlegen
            </button>
          </div>
        </div>
      )}

      {users.map(u => (
        <div key={u.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center text-sm font-bold shrink-0">
            {initials(u.username)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight">{u.username}</p>
            <p className="text-xs text-gray-400 mt-0.5">@{u.username.toLowerCase().replace(/\s+/g, '.')}</p>
          </div>

          {editingId === u.id ? (
            <select
              value={editingRole}
              onChange={e => setEditingRole(e.target.value as 'VISITOR' | 'MEMBER' | 'ADMIN')}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy-700"
            >
              <option value="VISITOR">Mitglied</option>
              <option value="MEMBER">Vorstandschaft</option>
              <option value="ADMIN">Admin</option>
            </select>
          ) : (
            <RoleBadge role={u.role} />
          )}

          <div className="flex gap-1.5 shrink-0">
            {editingId === u.id ? (
              <>
                <button
                  onClick={() => saveRole(u.id)}
                  className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors"
                  title="Speichern"
                >
                  <Check size={15} />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="w-9 h-9 rounded-lg bg-cream-100 text-gray-400 flex items-center justify-center hover:bg-cream-200 transition-colors"
                  title="Abbrechen"
                >
                  <X size={15} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setEditingId(u.id); setEditingRole(u.role) }}
                  className="w-9 h-9 rounded-lg bg-cream-100 text-gray-500 flex items-center justify-center hover:bg-cream-200 transition-colors"
                  title="Rolle bearbeiten"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteUser(u.id, u.username)}
                  className="w-9 h-9 rounded-lg bg-cream-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Löschen"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      <p className="text-xs text-gray-400 px-1">Benutzernamen können nur direkt in Supabase geändert werden.</p>

      {/* Rechteübersicht */}
      <div className="mt-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Rechteübersicht</p>
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Funktion</th>
                <th className="text-center px-3 py-3 text-xs text-gray-500 font-semibold">Mitglied</th>
                <th className="text-center px-3 py-3 text-xs text-gray-500 font-semibold">Vorstand</th>
                <th className="text-center px-3 py-3 text-xs text-gray-500 font-semibold">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ['Inventar einsehen',          true,  true,  true ],
                ['Veranstaltungen einsehen',  true,  true,  true ],
                ['Einkaufsliste',             false, true,  true ],
                ['Inventar bearbeiten',        false, true,  true ],
                ['Veranstaltungen verwalten', false, true,  true ],
                ['Kategorien verwalten',      false, false, true ],
                ['Räume verwalten',           false, false, true ],
                ['Benutzer verwalten',        false, false, true ],
              ].map(([label, visitor, member, admin]) => (
                <tr key={label as string}>
                  <td className="px-4 py-2.5 text-gray-700 text-xs">{label as string}</td>
                  {([visitor, member, admin] as boolean[]).map((allowed, i) => (
                    <td key={i} className="px-3 py-2.5 text-center text-xs">
                      {allowed
                        ? <span className="text-teal-600 font-bold">✓</span>
                        : <span className="text-gray-200">—</span>
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
    category_id: 'Kategorie', status: 'Status', defect_note: 'Defekt-Notiz',
  }

  if (loading) return <p className="text-gray-400">Lade…</p>

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Zeitpunkt</th>
            <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Benutzer</th>
            <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Inventar</th>
            <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Feld</th>
            <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Änderung</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {logs.map(log => (
            <tr key={log.id}>
              <td className="px-4 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                {new Date(log.changed_at).toLocaleString('de-DE')}
              </td>
              <td className="px-4 py-2.5 text-gray-900 text-xs">{log.user?.username ?? '—'}</td>
              <td className="px-4 py-2.5 text-gray-900 text-xs">{log.equipment?.name ?? '—'}</td>
              <td className="px-4 py-2.5 text-gray-500 text-xs">{fieldLabel[log.field] ?? log.field}</td>
              <td className="px-4 py-2.5 text-xs">
                <span className="text-red-400 line-through">{log.old_value ?? '—'}</span>
                {' → '}
                <span className="text-teal-600">{log.new_value ?? '—'}</span>
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={5} className="text-center text-gray-400 py-8 text-sm">Keine Einträge</td></tr>
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
        className="mb-4 flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white px-5 py-3 rounded-xl font-medium transition-colors"
      >
        <FileDown size={16} /> Als PDF drucken
      </button>
      <div ref={printRef}>
        <h1>Inventarliste HSV Pegnitz — {new Date().toLocaleDateString('de-DE')}</h1>
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Anzahl</th><th>Raum</th><th>Schrank</th><th>Kategorie</th><th>Status</th>
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

const inputCls = 'w-full rounded-xl px-4 py-3 bg-cream-100 border-0 text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-700 text-sm'

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

  if (loading) return <p className="text-gray-400">Lade…</p>

  return (
    <div className="space-y-3">
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
          className="px-5 py-3 bg-navy-700 hover:bg-navy-800 disabled:opacity-40 text-white rounded-xl font-semibold transition-colors"
        >
          Hinzufügen
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white rounded-xl overflow-hidden shadow-sm">
        {categories.map((cat, i) => (
          <div key={cat.id} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
            {editingId === cat.id ? (
              <input
                value={editingName}
                onChange={e => setEditingName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename(cat.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                autoFocus
                className="flex-1 rounded-lg px-3 py-1.5 bg-cream-100 border-0 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
              />
            ) : (
              <span className="flex-1 text-sm text-gray-900">{cat.name}</span>
            )}
            <div className="flex gap-1.5 shrink-0">
              {editingId === cat.id ? (
                <>
                  <button onClick={() => handleRename(cat.id)} className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingId(null)} className="w-9 h-9 rounded-lg bg-cream-100 text-gray-400 flex items-center justify-center hover:bg-cream-200">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditingId(cat.id); setEditingName(cat.name) }} className="w-9 h-9 rounded-lg bg-cream-100 text-gray-500 flex items-center justify-center hover:bg-cream-200">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="w-9 h-9 rounded-lg bg-cream-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">Keine Kategorien vorhanden</p>
        )}
      </div>
    </div>
  )
}

function DatenschutzTab() {
  const h2Cls = 'text-sm font-semibold text-gray-900 mb-2 mt-5'
  const pCls = 'text-sm text-gray-600 leading-relaxed'
  const liCls = 'text-sm text-gray-600'

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm space-y-1 max-w-2xl">
      <div className="bg-navy-50 border border-navy-100 rounded-xl px-4 py-3 mb-2">
        <p className="text-sm text-navy-700">
          Diese Datenschutzerklärung beschreibt, welche Daten in der Inventar-App des HSV Pegnitz gespeichert werden,
          wo sie liegen und wer Zugriff hat.
        </p>
      </div>

      <h2 className={h2Cls}>Welche Daten werden gespeichert?</h2>
      <ul className="list-disc list-inside space-y-1 pl-1">
        <li className={liCls}><strong>Benutzerkonten:</strong> Benutzername und Rolle</li>
        <li className={liCls}><strong>Inventar:</strong> Name, Anzahl, Standort, Status, optionales Foto</li>
        <li className={liCls}><strong>Veranstaltungen:</strong> Name, Datum, Aufgaben, Notizen</li>
        <li className={liCls}><strong>Einkaufsliste:</strong> Einträge mit Bezug zum Inventar und zuständigem Benutzer</li>
        <li className={liCls}><strong>Änderungsprotokoll:</strong> Wer welches Inventar wann geändert hat</li>
        <li className={liCls}><strong>Push-Abonnement:</strong> Browser-Push-Endpunkt für interne Benachrichtigungen</li>
      </ul>

      <h2 className={h2Cls}>Wo werden die Daten gespeichert?</h2>
      <p className={pCls}>
        Alle Daten werden in einer <strong>Supabase-Datenbank (PostgreSQL)</strong> gespeichert,
        EU-Region Frankfurt. Das Frontend wird über <strong>GitHub Pages</strong> bereitgestellt.
      </p>

      <h2 className={h2Cls}>Wer hat Zugriff?</h2>
      <ul className="list-disc list-inside space-y-1 pl-1">
        <li className={liCls}><strong>Mitglieder</strong> können Inventar und Veranstaltungen einsehen</li>
        <li className={liCls}><strong>Vorstandschaft</strong> kann zusätzlich Inventar und Einkaufsliste verwalten</li>
        <li className={liCls}><strong>Admin</strong> hat vollen Zugriff inkl. Benutzerverwaltung</li>
        <li className={liCls}><strong>Supabase Inc.</strong> als Auftragsverarbeiter</li>
      </ul>

      <h2 className={h2Cls}>Keine Drittanbieter</h2>
      <p className={pCls}>Kein Analytics, kein Tracking. Einziger externer Dienst: Supabase Inc.</p>

      <h2 className={h2Cls}>Kontakt & Löschung</h2>
      <p className={pCls}>
        <strong>Sabine Neupert</strong> · <a href="mailto:neupert.sabine@outlook.com" className="text-navy-700 underline">neupert.sabine@outlook.com</a>
      </p>
    </div>
  )
}

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
}

type HelperRow = {
  member_id: string
  time_start: string | null
  time_end: string | null
  member: { name: string } | null
  tournament: { date: string; is_template: boolean; name: string } | null
}

function MitgliederTab() {
  const { members, addMember, updateMember, deleteMember } = useClubMembers()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const [helperRows, setHelperRows] = useState<HelperRow[]>([])
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    supabase
      .from('tournament_helpers')
      .select('member_id, time_start, time_end, member:club_members(name), tournament:tournaments(date, is_template, name)')
      .not('member_id', 'is', null)
      .then(({ data }) => {
        setHelperRows((data ?? []) as unknown as HelperRow[])
      })
  }, [])

  const availableYears = [...new Set(
    helperRows
      .filter(r => r.tournament && !r.tournament.is_template)
      .map(r => new Date(r.tournament!.date).getFullYear())
  )].sort((a, b) => b - a)

  const yearRows = helperRows.filter(r =>
    r.tournament &&
    !r.tournament.is_template &&
    new Date(r.tournament.date).getFullYear() === selectedYear &&
    r.time_start && r.time_end
  )

  const hoursByMember: Record<string, { name: string; count: number; hours: number }> = {}
  for (const row of yearRows) {
    if (!row.member_id || !row.time_start || !row.time_end) continue
    const name = row.member?.name ?? '—'
    if (!hoursByMember[row.member_id]) hoursByMember[row.member_id] = { name, count: 0, hours: 0 }
    hoursByMember[row.member_id].count++
    hoursByMember[row.member_id].hours += calcHours(row.time_start, row.time_end)
  }
  const hoursTable = Object.values(hoursByMember).sort((a, b) => b.hours - a.hours)

  function openAdd() { setEditId(null); setFormName(''); setShowForm(true) }
  function openEdit(id: string, name: string) { setEditId(id); setFormName(name); setShowForm(true) }
  function cancelForm() { setShowForm(false); setEditId(null); setFormName('') }

  async function handleSave() {
    if (!formName.trim()) return
    setSaving(true)
    if (editId) {
      await updateMember(editId, formName.trim())
    } else {
      await addMember(formName.trim())
    }
    setSaving(false)
    cancelForm()
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Member management */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Vereinsmitglieder</p>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy-700 text-white text-sm hover:bg-navy-800"
          >
            <Plus size={14} /> Mitglied anlegen
          </button>
        </div>

        {members.length === 0 && (
          <p className="text-sm text-gray-400 py-6 text-center">Noch keine Mitglieder angelegt.</p>
        )}

        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
              <span className="flex-1 text-sm text-gray-900">{m.name}</span>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => openEdit(m.id, m.name)}
                  className="w-8 h-8 rounded-lg bg-cream-100 text-gray-500 flex items-center justify-center hover:bg-cream-200"
                ><Pencil size={13} /></button>
                {confirmDeleteId === m.id ? (
                  <span className="flex items-center gap-1 text-xs">
                    <button onClick={() => { deleteMember(m.id); setConfirmDeleteId(null) }} className="px-1.5 py-1 rounded bg-red-600 text-white hover:bg-red-700">Ja</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="px-1.5 py-1 rounded border border-gray-300 text-gray-600">Nein</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(m.id)}
                    className="w-8 h-8 rounded-lg bg-cream-100 text-gray-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500"
                  ><Trash2 size={13} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Hours report */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Stunden-Auswertung</p>
          {availableYears.length > 0 && (
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="rounded-lg px-2 py-1 bg-cream-100 border-0 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy-700"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
        </div>

        {hoursTable.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            {availableYears.length === 0 ? 'Noch keine Helferstunden erfasst.' : `Keine Daten für ${selectedYear}.`}
          </p>
        ) : (
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Mitglied</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-500 font-semibold">Einsätze</th>
                  <th className="text-right px-4 py-3 text-xs text-gray-500 font-semibold">Stunden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hoursTable.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-gray-900 text-sm">{row.name}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-sm text-right">{row.count}</td>
                    <td className="px-4 py-2.5 text-navy-700 font-semibold text-sm text-right">{row.hours.toFixed(1)} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-cream-50 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="text-lg font-bold text-navy-900">{editId ? 'Mitglied bearbeiten' : 'Mitglied anlegen'}</h2>
              <button onClick={cancelForm} className="p-2 rounded-full bg-cream-100 text-gray-500 hover:bg-cream-200">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 pb-4">
              <label className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Name</label>
              <input
                autoFocus
                value={formName}
                onChange={e => setFormName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                placeholder="Vorname Nachname"
                className="w-full rounded-xl px-4 py-3 text-gray-900 bg-cream-100 border-0 focus:outline-none focus:ring-2 focus:ring-navy-700 text-sm"
              />
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={cancelForm} className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50">
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold"
              >
                <Check size={16} /> {saving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const roleBadgeConfig: Record<string, { label: string; cls: string }> = {
  ADMIN:   { label: 'Admin',         cls: 'bg-navy-700 text-white' },
  MEMBER:  { label: 'Vorstandschaft', cls: 'border border-amber-400 text-amber-600 bg-amber-50' },
  VISITOR: { label: 'Mitglied',      cls: 'border border-gray-300 text-gray-500 bg-white' },
}

function RoleBadge({ role }: { role: string }) {
  const cfg = roleBadgeConfig[role] ?? { label: role, cls: 'border border-gray-300 text-gray-500' }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold shrink-0 ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
