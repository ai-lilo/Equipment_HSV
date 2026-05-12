import type { EquipmentStatus } from '../../types'

const config: Record<EquipmentStatus, { label: string; cls: string }> = {
  OK: { label: 'OK', cls: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  DEFECT: { label: 'Defekt', cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  IN_REPAIR: { label: 'In Reparatur', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
}

export default function StatusBadge({ status }: { status: EquipmentStatus }) {
  const { label, cls } = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {label}
    </span>
  )
}
