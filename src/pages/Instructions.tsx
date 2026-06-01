import { useState } from 'react'
import { Plus, BookOpen, ChevronRight, Pencil, Trash2, ListOrdered } from 'lucide-react'
import { toast } from 'sonner'
import { useInstructions } from '../hooks/useInstructions'
import { useInventory } from '../hooks/useInventory'
import InstructionView from '../components/instructions/InstructionView'
import InstructionForm from '../components/instructions/InstructionForm'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { Instruction, InstructionStep, User } from '../types'

interface Props {
  user: User
  initialEquipmentId?: string
}

export default function Instructions({ user, initialEquipmentId }: Props) {
  const { instructions, loading, loadSteps, saveInstruction, deleteInstruction } = useInstructions()
  const { equipment } = useInventory()
  const isAdmin = user.role === 'ADMIN'

  const [viewItem, setViewItem] = useState<{ instruction: Instruction; steps: InstructionStep[] } | null>(null)
  const [editItem, setEditItem] = useState<{ instruction: Instruction | null; steps: InstructionStep[] } | null>(null)
  const [deleteItem, setDeleteItem] = useState<Instruction | null>(null)
  const [loadingSteps, setLoadingSteps] = useState<string | null>(null)
  const [filterEquipmentId] = useState<string | undefined>(initialEquipmentId)

  async function openView(instruction: Instruction) {
    setLoadingSteps(instruction.id)
    const steps = await loadSteps(instruction.id)
    setLoadingSteps(null)
    setViewItem({ instruction, steps })
  }

  async function openEdit(instruction: Instruction | null) {
    if (instruction) {
      const steps = await loadSteps(instruction.id)
      setEditItem({ instruction, steps })
    } else {
      setEditItem({ instruction: null, steps: [] })
    }
  }

  async function handleSave(
    data: { id?: string; title: string; description: string; equipment_id: string | null },
    steps: import('../hooks/useInstructions').StepDraft[]
  ) {
    const result = await saveInstruction(data, steps, user.id)
    if (!result.error) toast.success('Anleitung gespeichert')
    return result
  }

  async function handleDelete(instruction: Instruction) {
    const result = await deleteInstruction(instruction.id)
    if (result.error) toast.error(result.error)
    else toast.success('Anleitung gelöscht')
    setDeleteItem(null)
  }

  // Group instructions: by equipment name, then "Allgemein"
  const filtered = filterEquipmentId
    ? instructions.filter(i => i.equipment_id === filterEquipmentId)
    : instructions

  const grouped: { label: string; items: Instruction[] }[] = []
  const withEquipment = filtered.filter(i => i.equipment_id && i.equipment)
  const withoutEquipment = filtered.filter(i => !i.equipment_id)

  const byEquipment = new Map<string, Instruction[]>()
  for (const inst of withEquipment) {
    const name = inst.equipment!.name
    if (!byEquipment.has(name)) byEquipment.set(name, [])
    byEquipment.get(name)!.push(inst)
  }
  byEquipment.forEach((items, label) => grouped.push({ label, items }))
  grouped.sort((a, b) => a.label.localeCompare(b.label, 'de'))
  if (withoutEquipment.length > 0) grouped.push({ label: 'Allgemein', items: withoutEquipment })

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <BookOpen size={22} className="text-navy-700" />
          <h1 className="text-xl font-bold text-gray-900">Arbeitsanweisungen</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => openEdit(null)}
            className="flex items-center gap-1.5 px-3 py-2 bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={16} />
            Neue Anleitung
          </button>
        )}
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm">Lädt…</div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <ListOrdered size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Noch keine Anleitungen vorhanden.</p>
          {isAdmin && (
            <button
              onClick={() => openEdit(null)}
              className="mt-3 text-navy-700 text-sm font-medium hover:underline"
            >
              Erste Anleitung erstellen
            </button>
          )}
        </div>
      )}

      {/* Grouped list */}
      {!loading && grouped.map(group => (
        <div key={group.label} className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">{group.label}</h2>
          <div className="space-y-2">
            {group.items.map(instruction => (
              <div
                key={instruction.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3 hover:border-navy-200 transition-colors"
              >
                <button
                  className="flex-1 flex items-center gap-3 min-w-0 text-left"
                  onClick={() => openView(instruction)}
                >
                  <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                    <BookOpen size={17} className="text-navy-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{instruction.title}</p>
                    {instruction.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{instruction.description}</p>
                    )}
                  </div>
                  {loadingSteps === instruction.id ? (
                    <span className="text-xs text-gray-400 shrink-0">Lädt…</span>
                  ) : (
                    <ChevronRight size={16} className="text-gray-300 shrink-0" />
                  )}
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(instruction)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Bearbeiten"
                    >
                      <Pencil size={15} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => setDeleteItem(instruction)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={15} className="text-red-400" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* View Modal */}
      {viewItem && (
        <InstructionView
          instruction={viewItem.instruction}
          steps={viewItem.steps}
          onClose={() => setViewItem(null)}
        />
      )}

      {/* Edit/Create Modal */}
      {editItem !== null && (
        <InstructionForm
          instruction={editItem.instruction}
          existingSteps={editItem.steps}
          equipment={equipment}
          onSave={handleSave}
          onClose={() => setEditItem(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteItem && (
        <ConfirmDialog
          title="Anleitung löschen"
          message={`„${deleteItem.title}" und alle Schritte unwiderruflich löschen?`}
          confirmLabel="Löschen"
          onConfirm={() => handleDelete(deleteItem)}
          onCancel={() => setDeleteItem(null)}
        />
      )}
    </div>
  )
}
