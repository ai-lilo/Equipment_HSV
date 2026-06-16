import { useState, useRef } from 'react'
import { X, Camera, Image as ImageIcon, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sendDefectNotification, sendRepairedNotification } from '../../lib/push'
import type { Equipment, Room, Cabinet, User, EquipmentStatus, Category } from '../../types'

interface Props {
  item: Equipment | null
  rooms: Room[]
  cabinets: Cabinet[]
  categories: Category[]
  user: User
  initCabinetId?: string
  onClose: () => void
  onSaved: () => void
}

export default function EquipmentForm({ item, rooms, cabinets, categories, user, initCabinetId, onClose, onSaved }: Props) {
  const isNew = item === null

  const [name, setName] = useState(item?.name ?? '')
  const [count, setCount] = useState(String(item?.count ?? 1))
  const [roomId, setRoomId] = useState(item?.room_id ?? rooms[0]?.id ?? '')
  const [cabinetId, setCabinetId] = useState(item?.cabinet_id ?? initCabinetId ?? '')
  const [categoryId, setCategoryId] = useState<string>(item?.category_id ?? '')
  const [isConsumable, setIsConsumable] = useState(item?.is_consumable ?? false)
  const [description, setDescription] = useState(item?.description ?? '')
  const [status, setStatus] = useState<EquipmentStatus>(item?.status ?? 'OK')
  const [defectNote, setDefectNote] = useState(item?.defect_note ?? '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(item?.photo_url ?? null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(item?.photo_url ?? null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

  async function handleSave() {
    if (!name.trim()) { setError('Name ist Pflichtfeld'); return }
    if (!roomId) { setError('Raum ist Pflichtfeld'); return }
    const parsedCount = parseInt(count)
    if (isNaN(parsedCount) || parsedCount < 1) { setError('Ungültige Anzahl'); return }
    if (photoFile && !ALLOWED_MIME.includes(photoFile.type)) {
      setError('Ungültiger Dateityp. Erlaubt: JPG, PNG, WebP, GIF'); return
    }

    setSaving(true)
    setError(null)

    if (isNew) {
      const payload = {
        name: name.trim(),
        count: parsedCount,
        room_id: roomId,
        cabinet_id: cabinetId || null,
        category_id: categoryId || null,
        is_consumable: isConsumable,
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
        const { error: photoErr } = await supabase.from('equipment').update({ photo_url: uploadedUrl }).eq('id', data.id)
        if (photoErr) { setError(`Foto-URL konnte nicht gespeichert werden: ${photoErr.message}`); setSaving(false); return }
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
        category_id: categoryId || null,
        is_consumable: isConsumable,
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
        ['category_id', item.category_id, payload.category_id],
        ['is_consumable', String(item.is_consumable), String(payload.is_consumable)],
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
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
      <div className="bg-cream-50 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-lg font-bold text-navy-900">
            {isNew ? 'Inventar hinzufügen' : 'Inventar bearbeiten'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full bg-cream-100 text-gray-500 hover:bg-cream-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-4 space-y-4">
          <Field label="Bezeichnung">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className={inputCls}
              placeholder="z.B. Hürden Set"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Anzahl">
              <input
                type="number"
                min={1}
                value={count}
                onChange={e => setCount(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Kategorie">
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputCls}>
                <option value="">— keine —</option>
                {categories.filter(c => c.name !== 'Verbrauchsmaterial').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>

          <div className={roomCabinets.length > 0 ? 'grid grid-cols-2 gap-3' : ''}>
            <Field label="Raum">
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
          </div>

          <Field label="Status">
            <div className="flex rounded-xl bg-cream-100 p-1 gap-1">
              {(['OK', 'DEFECT', 'IN_REPAIR'] as EquipmentStatus[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    status === s
                      ? s === 'OK'
                        ? 'bg-teal-100 text-teal-700'
                        : s === 'DEFECT'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                      : 'text-gray-500 hover:text-gray-700'
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

          <button
            type="button"
            onClick={() => setIsConsumable(!isConsumable)}
            className="w-full flex items-center gap-4 px-4 py-3 bg-cream-100 rounded-xl text-left transition-colors hover:bg-cream-200"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              isConsumable ? 'bg-navy-700 border-navy-700' : 'border-gray-400 bg-white'
            }`}>
              {isConsumable && <Check size={12} className="text-white" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Verbrauchsmaterial</p>
              <p className="text-xs text-gray-400">Erscheint auf der Einkaufsliste.</p>
            </div>
          </button>

          <Field label="Beschreibung">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="Optional"
            />
          </Field>

          <Field label="Foto">
            {photoPreview ? (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Equipment-Foto"
                  className="w-full max-h-48 object-cover rounded-xl"
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
                className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-cream-100 rounded-xl text-gray-400 hover:border-navy-700 hover:text-navy-700 transition-colors bg-cream-100"
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

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-navy-700 hover:bg-navy-800 disabled:opacity-50 text-white font-semibold transition-colors"
          >
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-xl px-4 py-3 text-gray-900 bg-cream-100 border-0 focus:outline-none focus:ring-2 focus:ring-navy-700'
