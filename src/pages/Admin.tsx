import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { FileDown, Users, History } from 'lucide-react'
import type { User, ChangeLog, Equipment, Room, Cabinet } from '../types'

interface Props {
  user: User
}

export default function Admin({ user: _user }: Props) {
  const [tab, setTab] = useState<'users' | 'log' | 'pdf'>('users')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Admin</h1>

      <div className="flex gap-2 mb-6">
        <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>
          <Users size={16} /> Benutzer
        </TabBtn>
        <TabBtn active={tab === 'log'} onClick={() => setTab('log')}>
          <History size={16} /> Änderungshistorie
        </TabBtn>
        <TabBtn active={tab === 'pdf'} onClick={() => setTab('pdf')}>
          <FileDown size={16} /> PDF-Export
        </TabBtn>
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'log' && <LogTab />}
      {tab === 'pdf' && <PdfTab />}
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

  if (loading) return <p className="text-gray-400">Lade…</p>

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
          <option value="VISITOR">Besucher</option>
          <option value="MEMBER">Mitglied</option>
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
      <p className="text-xs text-gray-400">Benutzernamen können nur direkt in Supabase geändert werden.</p>
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
    sport: 'Sportart', status: 'Status', defect_note: 'Defekt-Notiz',
  }

  if (loading) return <p className="text-gray-400">Lade…</p>

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
              <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                {new Date(log.changed_at).toLocaleString('de-DE')}
              </td>
              <td className="px-4 py-2.5 text-gray-900 dark:text-white">{log.user?.username ?? '—'}</td>
              <td className="px-4 py-2.5 text-gray-900 dark:text-white">{log.equipment?.name ?? '—'}</td>
              <td className="px-4 py-2.5 text-gray-500">{fieldLabel[log.field] ?? log.field}</td>
              <td className="px-4 py-2.5">
                <span className="text-red-500 line-through">{log.old_value ?? '—'}</span>
                {' → '}
                <span className="text-green-600 dark:text-green-400">{log.new_value ?? '—'}</span>
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr><td colSpan={5} className="text-center text-gray-400 py-8">Keine Einträge</td></tr>
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
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('equipment').select('*').order('name'),
      supabase.from('rooms').select('*').order('name'),
      supabase.from('cabinets').select('*').order('name'),
    ]).then(([e, r, c]) => {
      setEquipment((e.data ?? []) as Equipment[])
      setRooms((r.data ?? []) as Room[])
      setCabinets((c.data ?? []) as Cabinet[])
    })
  }, [])

  function roomName(id: string) { return rooms.find(r => r.id === id)?.name ?? id }
  function cabName(id: string | null) { return id ? (cabinets.find(c => c.id === id)?.name ?? '') : '' }

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
      <script>window.onload=()=>window.print()</script>
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
              <th>Sportart</th>
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
                <td>{e.sport ?? ''}</td>
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
