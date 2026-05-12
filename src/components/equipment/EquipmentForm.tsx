import { useState, useRef } from 'react'
import { X, Trash2, Save, Camera, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sendDefectNotification, sendRepairedNotification } from '../../lib/push'
import ConfirmDialog from '../ui/ConfirmDialog'
import { SPORTS } from '../../types'
import type { Equipment, Room, Cabinet, User, EquipmentStatus, Sport } from '../../types'

interface Props {
  item: Equipment | null
  rooms: Room[]
  cabinets: Cabinet[]
  user: User
  initCabinetId?: string
  onClose: () => void
  onSaved: () => void
}

export default function EquipmentForm({ item, rooms, cabinets, user, initCabinetId, onClose, onSaved }: Props) {
  const isNew = item === null

  const [name, setName] = useState(item?.name ?? '')
  const [count, setCount] = useState(String(item?.count ?? 1))
  const [roomId, setRoomId] = useState(item?.room_id ?? rooms[0]?.id ?? '')
  const [cabinetId, setCabinetId] = useState(item?.cabinet_id ?? initCabinetId ?? '')
  const [sport, setSport] = useState<Sport | ''>(item?.sport ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [status, setStatus] = useState<EquipmentStatus>(item?.status ?? 'OK')
  const [defectNote, setDefectNote] = useState(item?.defect_note ?? '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(item?.photo_url ?? null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(item?.photo_url ?? null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const roomCabinets = cabinets.filter(c => c.room_id === roomId)

  async function logChange(equipmentId: string, field: string, oldVal: string | null, newVal: string | null) {
    if (oldVal === newVal) return
    await supabase.from('change_log').insert({
      equipment_id: equipmentId,
      user_id: user.id,
      field,
      old_value: oldVal,
      new_value: newVal,
    })
  }

  async function uploadPhoto(equipmentId: string): Promise<string | null> {
    if (!photoFile) return photoUrl
    const ext = photoFile.name.split('.').pop() ?? 'jpg'
    const path = `${equipmentId}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('equipment-photos')
      .upload(path, photoFile, { upsert: true })
    if (uploadErr) { setError(`Foto-Upload fehlgeschlagen: ${uploadErr.message}`); return null }
    const { data } = supabase.storage.from('equipment-photos').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!name.trim()) { setError('Name ist Pflichtfeld'); return }
    if (!roomId) { setError('Raum ist Pflichtfeld'); return }
    const parsedCount = parseInt(count)
    if (isNaN(parsedCount) || parsedCount < 1) { setError('Ungültige Anzahl'); return }

    setSaving(true)
    setError(null)

    if (isNew) {
      const payload = {
        name: name.trim(),
        count: parsedCount,
        room_id: roomId,
        cabinet_id: cabinetId || null,
        sport: sport || null,
        description: description.trim() || null,
        status,
        defect_note: (status !== 'OK' && defectNote.trim()) ? defectNote.trim() : null,
        photo_url: null as string | null,
        updated_at: new Date().toISOString(),
      }
      const { data, error: err } = await supabase.from('equipment').insert(payload).select().single()
      if (err || !data) { setError(err?.message ?? 'Fehler beim Speichern'); setSaving(false); return }

      const uploadedUrl = await uploadPhoto(data.id)
      if (uploadedUrl !== null && uploadedUrl !== photoUrl) {
        await supabase.from('equipment').update({ photo_url: uploadedUrl }).eq('id', data.id)
      }
      if (status === 'DEFECT') await sendDefectNotification(name)
    } else {
      const uploadedUrl = await uploadPhoto(item.id)
      if (uploadedUrl === null && photoFile) { setSaving(false); return }

      const payload = {
        name: name.trim(),
        count: parsedCount,
        room_id: roomId,
        cabinet_id: cabinetId || null,
        sport: sport || null,
        description: description.trim() || null,
        status,
        defect_note: (status !== 'OK' && defectNote.trim()) ? defectNote.trim() : null,
        photo_url: uploadedUrl,
        updated_at: new Date().toISOString(),
      }
      const { error: err } = await supabase.from('equipment').update(payload).eq('id', item.id)
      if (err) { setError(err.message); setSaving(false); return }

      const fields: Array<[string, string | null, string | null]> = [
        ['name', item.name, payload.name],
        ['count', String(item.count), String(payload.count)],
        ['room_id', item.room_id, payload.room_id],
        ['cabinet_id', item.cabinet_id, payload.cabinet_id],
        ['sport', item.sport, payload.sport],
        ['status', item.status, payload.status],
        ['defect_note', item.defect_note, payload.defect_note],
      ]
      await Promise.all(fields.map(([f, o, n]) => logChange(item.id, f, o, n)))

      if (item.status !== 'OK' && status === 'OK') await sendRepairedNotification(name)
      if (item.status === 'OK' && status === 'DEFECT') await sendDefectNotification(name)
    }

    setSaving(false)
    onSaved()
  }

  async function handleDelete() {
    if (!item) return
    if (item.photo_url) {
      const path = item.photo_url.split('/').pop()
      if (path) await supabase.storage.from('equipment-photos').remove([path])
    }
    await supabase.from('equipment').delete().eq('id', item.id)
    onSaved()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isNew ? 'Equipment hinzufügen' : 'Equipment bearbeiten'}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <Field label="Name *">
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
                placeholder="z.B. Hürden Set"
              />
            </Field>

            <Field label="Anzahl *">
              <input
                type="number"
                min={1}
                value={count}
                onChange={e => setCount(e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field label="Raum *">
              <select value={roomId} onChange={e => { setRoomId(e.target.value); setCabinetId('') }} className={inputCls}>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>

            {roomCabinets.length > 0 && (
              <Field label="Schrank">
                <select value={cabinetId} onChange={e => setCabinetId(e.target.value)} className={inputCls}>
                  <option value="">— kein Schrank —</option>
                  {roomCabinets.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            )}

            <Field label="Sportart">
              <select value={sport} onChange={e => setSport(e.target.value as Sport | '')} className={inputCls}>
                <option value="">— keine —</option>
                {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Beschreibung">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className={inputCls}
                placeholder="Optional"
              />
            </Field>

            <Field label="Status">
              <div className="flex gap-2">
                {(['OK', 'DEFECT', 'IN_REPAIR'] as EquipmentStatus[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      status === s
                        ? s === 'OK' ? 'bg-blue-800 text-white border-blue-800'
                          : s === 'DEFECT' ? 'bg-red-600 text-white border-red-600'
                          : 'bg-yellow-500 text-white border-yellow-500'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {s === 'OK' ? 'OK' : s === 'DEFECT' ? 'Defekt' : 'In Reparatur'}
                  </button>
                ))}
              </div>
            </Field>

            {status !== 'OK' && (
              <Field label="Defekt-Notiz">
                <textarea
                  value={defectNote}
                  onChange={e => setDefectNote(e.target.value)}
                  rows={2}
                  className={inputCls}
                  placeholder="Was ist defekt?"
                />
              </Field>
            )}

            <Field label="Foto">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Equipment-Foto"
                    className="w-full max-h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    title="Foto entfernen"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-700 transition-colors"
                >
                  <div className="flex gap-3">
                    <Camera size={22} />
                    <ImageIcon size={22} />
                  </div>
                  <span className="text-sm">Foto auswählen</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </Field>

            {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
          </div>

          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            {!isNew && user.role === 'ADMIN' && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                title="Löschen"
              >
                <Trash2 size={18} />
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white font-semibold transition-colors"
              >
                <Save size={16} />
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Equipment löschen"
          message={`„${item?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600'
