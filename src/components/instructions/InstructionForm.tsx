import { useState, useRef, useEffect } from 'react'
import { X, Plus, Trash2, ChevronUp, ChevronDown, Image as ImageIcon, Video } from 'lucide-react'
import { toast } from 'sonner'
import type { Instruction, InstructionStep, Equipment } from '../../types'
import type { StepDraft } from '../../hooks/useInstructions'
import ConfirmDialog from '../ui/ConfirmDialog'

interface Props {
  instruction: Instruction | null
  existingSteps: InstructionStep[]
  equipment: Equipment[]
  onSave: (data: { id?: string; title: string; description: string; equipment_id: string | null }, steps: StepDraft[]) => Promise<{ error: string | null }>
  onClose: () => void
}

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_VIDEO = ['video/mp4', 'video/quicktime', 'video/mov']
const MAX_SIZE_MB = 50

function emptyStep(index: number): StepDraft {
  return { order_index: index, description: '', media_url: null, media_type: null, file: null, preview: null }
}

export default function InstructionForm({ instruction, existingSteps, equipment, onSave, onClose }: Props) {
  const isNew = instruction === null

  const [title, setTitle] = useState(instruction?.title ?? '')
  const [description, setDescription] = useState(instruction?.description ?? '')
  const [equipmentId, setEquipmentId] = useState<string>(instruction?.equipment_id ?? '')
  const [steps, setSteps] = useState<StepDraft[]>(() =>
    existingSteps.length > 0
      ? existingSteps.map(s => ({
          id: s.id,
          order_index: s.order_index,
          description: s.description,
          media_url: s.media_url,
          media_type: s.media_type,
          file: null,
          preview: s.media_url,
        }))
      : [emptyStep(0)]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(null)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    fileInputRefs.current = fileInputRefs.current.slice(0, steps.length)
  }, [steps.length])

  function handleFileChange(index: number, file: File | null) {
    if (!file) return
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Datei zu groß. Maximum: ${MAX_SIZE_MB} MB`)
      return
    }
    const isImage = ALLOWED_IMAGE.includes(file.type)
    const isVideo = ALLOWED_VIDEO.includes(file.type)
    if (!isImage && !isVideo) {
      toast.error('Ungültiger Dateityp. Erlaubt: JPG, PNG, WebP, MP4, MOV')
      return
    }
    const preview = URL.createObjectURL(file)
    setSteps(prev => prev.map((s, i) =>
      i === index
        ? { ...s, file, preview, media_type: isVideo ? 'video' : 'image', media_url: null }
        : s
    ))
  }

  function removeMedia(index: number) {
    setSteps(prev => prev.map((s, i) =>
      i === index ? { ...s, file: null, preview: null, media_url: null, media_type: null } : s
    ))
  }

  function addStep() {
    setSteps(prev => [...prev, emptyStep(prev.length)])
  }

  function removeStep(index: number) {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order_index: i })))
  }

  function moveStep(index: number, dir: -1 | 1) {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= steps.length) return
    setSteps(prev => {
      const arr = [...prev]
      ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
      return arr.map((s, i) => ({ ...s, order_index: i }))
    })
  }

  async function handleSave() {
    if (!title.trim()) { setError('Titel ist Pflichtfeld'); return }
    const emptyDescIndex = steps.findIndex(s => !s.description.trim())
    if (emptyDescIndex !== -1) {
      setError(`Schritt ${emptyDescIndex + 1}: Beschreibung ist Pflichtfeld`)
      return
    }

    setSaving(true)
    setError(null)

    const result = await onSave(
      { id: instruction?.id, title, description, equipment_id: equipmentId || null },
      steps
    )

    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4 py-0 sm:py-6">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-lg text-gray-900">
            {isNew ? 'Neue Anleitung' : 'Anleitung bearbeiten'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Titel *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="z.B. Aufsitzrasenmäher starten"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Kurzbeschreibung</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optionale Übersicht zur Anleitung"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none"
            />
          </div>

          {/* Equipment Link */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Gerät (optional)</label>
            <select
              value={equipmentId}
              onChange={e => setEquipmentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 bg-white"
            >
              <option value="">— Kein Gerät —</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name}</option>
              ))}
            </select>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Schritte</label>
              <button
                onClick={addStep}
                className="flex items-center gap-1 text-xs font-medium text-navy-700 hover:text-navy-900 px-2 py-1 rounded-lg hover:bg-navy-50 transition-colors"
              >
                <Plus size={14} />
                Schritt hinzufügen
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                  {/* Step header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-navy-700">Schritt {index + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveStep(index, -1)}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Nach oben"
                      >
                        <ChevronUp size={14} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => moveStep(index, 1)}
                        disabled={index === steps.length - 1}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Nach unten"
                      >
                        <ChevronDown size={14} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => {
                          const s = steps[index]
                          const hasContent = s.description.trim() !== '' || s.preview != null
                          if (hasContent) {
                            setConfirmDeleteIndex(index)
                          } else {
                            removeStep(index)
                          }
                        }}
                        disabled={steps.length === 1}
                        className="p-1 rounded hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Schritt löschen"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <textarea
                    value={step.description}
                    onChange={e => setSteps(prev => prev.map((s, i) => i === index ? { ...s, description: e.target.value } : s))}
                    placeholder="Beschreibung dieses Schritts *"
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 resize-none bg-white"
                  />

                  {/* Media */}
                  <div className="mt-2">
                    {step.preview ? (
                      <div className="relative rounded-lg overflow-hidden bg-gray-100">
                        {step.media_type === 'video' ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg">
                            <Video size={14} />
                            {step.file?.name ?? 'Video'}
                          </div>
                        ) : (
                          <img src={step.preview} alt="" className="w-full max-h-32 object-contain" />
                        )}
                        <button
                          onClick={() => removeMedia(index)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 transition-colors"
                          title="Bild/Video entfernen"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="flex items-center gap-2 text-xs text-gray-500 hover:text-navy-700 px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-navy-400 transition-colors w-full"
                      >
                        <ImageIcon size={14} />
                        Bild oder Video hinzufügen
                      </button>
                    )}
                    <input
                      ref={el => { fileInputRefs.current[index] = el }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                      className="hidden"
                      onChange={e => handleFileChange(index, e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-navy-700 hover:bg-navy-800 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
          >
            {saving ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>

      {confirmDeleteIndex !== null && (
        <ConfirmDialog
          title="Schritt löschen?"
          message="Dieser Schritt enthält Inhalt. Wirklich löschen?"
          confirmLabel="Löschen"
          onConfirm={() => {
            removeStep(confirmDeleteIndex)
            setConfirmDeleteIndex(null)
          }}
          onCancel={() => setConfirmDeleteIndex(null)}
        />
      )}
    </div>
  )
}
