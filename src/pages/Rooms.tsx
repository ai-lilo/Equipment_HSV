import { useState } from 'react'
import { Plus, Pencil, Trash2, QrCode, ChevronDown, ChevronRight, ArchiveX } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useInventory } from '../hooks/useInventory'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import QRModal from '../components/ui/QRModal'
import type { User, Room, Cabinet } from '../types'

interface Props {
  user: User
}

export default function Rooms({ user }: Props) {
  const { rooms, cabinets, equipment, loading, reload } = useInventory()
  const [editRoom, setEditRoom] = useState<Room | 'new' | null>(null)
  const [editCabinet, setEditCabinet] = useState<{ cabinet: Cabinet | null; roomId: string } | null>(null)
  const [deleteRoom, setDeleteRoom] = useState<Room | null>(null)
  const [deleteCabinet, setDeleteCabinet] = useState<Cabinet | null>(null)
  const [qrTarget, setQrTarget] = useState<{ label: string; url: string } | null>(null)
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())

  function toggleRoom(id: string) {
    setExpandedRooms(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function qrUrl(type: 'room' | 'cabinet', id: string) {
    const base = window.location.origin + import.meta.env.BASE_URL
    return `${base}?${type}=${id}`
  }

  async function saveRoom(name: string, id?: string) {
    if (id) {
      await supabase.from('rooms').update({ name, updated_at: new Date().toISOString() }).eq('id', id)
    } else {
      await supabase.from('rooms').insert({ name })
    }
    reload()
    setEditRoom(null)
  }

  async function saveRoomDelete(room: Room) {
    const equipInRoom = equipment.filter(e => e.room_id === room.id)
    if (equipInRoom.length > 0) {
      alert(`Raum kann nicht gelöscht werden — ${equipInRoom.length} Equipment-Einträge sind noch zugewiesen.`)
      return
    }
    await supabase.from('cabinets').delete().eq('room_id', room.id)
    await supabase.from('rooms').delete().eq('id', room.id)
    reload()
    setDeleteRoom(null)
  }

  async function saveCabinet(name: string, roomId: string, id?: string) {
    if (id) {
      await supabase.from('cabinets').update({ name, updated_at: new Date().toISOString() }).eq('id', id)
    } else {
      await supabase.from('cabinets').insert({ name, room_id: roomId })
    }
    reload()
    setEditCabinet(null)
  }

  async function saveCabinetDelete(cab: Cabinet) {
    const equipInCab = equipment.filter(e => e.cabinet_id === cab.id)
    if (equipInCab.length > 0) {
      alert(`Schrank kann nicht gelöscht werden — ${equipInCab.length} Equipment-Einträge sind noch zugewiesen.`)
      return
    }
    await supabase.from('cabinets').delete().eq('id', cab.id)
    reload()
    setDeleteCabinet(null)
  }

  if (loading) return <p className="text-center text-gray-400 py-12">Lade Daten…</p>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Räume & Schränke</h1>
        {user.role === 'ADMIN' && (
          <button
            onClick={() => setEditRoom('new')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={16} /> Raum hinzufügen
          </button>
        )}
      </div>

      <div className="space-y-3">
        {rooms.map(room => {
          const roomCabs = cabinets.filter(c => c.room_id === room.id)
          const expanded = expandedRooms.has(room.id)
          return (
            <div key={room.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-900">
                <button onClick={() => toggleRoom(room.id)} className="mr-1">
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <span className="font-semibold text-gray-900 dark:text-white flex-1">{room.name}</span>
                <span className="text-xs text-gray-400">{roomCabs.length} Schränke</span>
                <button onClick={() => setQrTarget({ label: room.name, url: qrUrl('room', room.id) })} className={iconBtn} title="QR-Code">
                  <QrCode size={16} />
                </button>
                {user.role === 'ADMIN' && (
                  <>
                    <button onClick={() => setEditRoom(room)} className={iconBtn} title="Bearbeiten"><Pencil size={16} /></button>
                    <button onClick={() => setDeleteRoom(room)} className={`${iconBtn} text-red-400 hover:text-red-600`} title="Löschen"><Trash2 size={16} /></button>
                  </>
                )}
              </div>

              {expanded && (
                <div className="px-4 py-3 space-y-2 bg-white dark:bg-gray-800">
                  {roomCabs.map(cab => (
                    <div key={cab.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <ArchiveX size={15} className="text-blue-400 shrink-0" />
                      <span className="text-sm text-gray-800 dark:text-gray-200 flex-1">{cab.name}</span>
                      <button onClick={() => setQrTarget({ label: `${room.name} › ${cab.name}`, url: qrUrl('cabinet', cab.id) })} className={iconBtn} title="QR-Code">
                        <QrCode size={14} />
                      </button>
                      {user.role === 'ADMIN' && (
                        <>
                          <button onClick={() => setEditCabinet({ cabinet: cab, roomId: room.id })} className={iconBtn} title="Bearbeiten"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteCabinet(cab)} className={`${iconBtn} text-red-400 hover:text-red-600`} title="Löschen"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  ))}
                  {user.role === 'ADMIN' && (
                    <button
                      onClick={() => setEditCabinet({ cabinet: null, roomId: room.id })}
                      className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 dark:text-green-400 py-1 px-2"
                    >
                      <Plus size={14} /> Schrank hinzufügen
                    </button>
                  )}
                  {roomCabs.length === 0 && user.role !== 'ADMIN' && (
                    <p className="text-sm text-gray-400 px-1">Keine Schränke</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {rooms.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-center py-8">Noch keine Räume angelegt.</p>}
      </div>

      {editRoom !== null && (
        <NameDialog
          title={editRoom === 'new' ? 'Raum hinzufügen' : 'Raum bearbeiten'}
          initial={editRoom === 'new' ? '' : editRoom.name}
          onSave={name => saveRoom(name, editRoom === 'new' ? undefined : editRoom.id)}
          onCancel={() => setEditRoom(null)}
        />
      )}

      {editCabinet !== null && (
        <NameDialog
          title={editCabinet.cabinet ? 'Schrank bearbeiten' : 'Schrank hinzufügen'}
          initial={editCabinet.cabinet?.name ?? ''}
          onSave={name => saveCabinet(name, editCabinet.roomId, editCabinet.cabinet?.id)}
          onCancel={() => setEditCabinet(null)}
        />
      )}

      {deleteRoom && (
        <ConfirmDialog
          title="Raum löschen"
          message={`„${deleteRoom.name}" wirklich löschen?`}
          onConfirm={() => saveRoomDelete(deleteRoom)}
          onCancel={() => setDeleteRoom(null)}
        />
      )}

      {deleteCabinet && (
        <ConfirmDialog
          title="Schrank löschen"
          message={`„${deleteCabinet.name}" wirklich löschen?`}
          onConfirm={() => saveCabinetDelete(deleteCabinet)}
          onCancel={() => setDeleteCabinet(null)}
        />
      )}

      {qrTarget && (
        <QRModal label={qrTarget.label} url={qrTarget.url} onClose={() => setQrTarget(null)} />
      )}
    </div>
  )
}

const iconBtn = 'p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors'

function NameDialog({ title, initial, onSave, onCancel }: {
  title: string
  initial: string
  onSave: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h2>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && value.trim() && onSave(value.trim())}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Name"
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Abbrechen
          </button>
          <button
            onClick={() => value.trim() && onSave(value.trim())}
            disabled={!value.trim()}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
