import { AlertTriangle, Wrench } from 'lucide-react'
import type { Equipment } from '../../types'

interface Props {
  equipment: Equipment[]
}

export default function StatusOverview({ equipment }: Props) {
  const defect = equipment.filter(e => e.status === 'DEFECT')
  const inRepair = equipment.filter(e => e.status === 'IN_REPAIR')

  if (defect.length === 0 && inRepair.length === 0) return null

  return (
    <div className="flex gap-3 mb-5">
      {defect.length > 0 && (
        <StatusCard
          icon={<AlertTriangle size={16} className="text-red-500" />}
          label="Defekt"
          count={defect.length}
          items={defect}
          borderCls="border-red-300"
          bgCls="bg-red-50"
          colorCls="text-red-500"
        />
      )}
      {inRepair.length > 0 && (
        <StatusCard
          icon={<Wrench size={16} className="text-amber-500" />}
          label="In Reparatur"
          count={inRepair.length}
          items={inRepair}
          borderCls="border-amber-300"
          bgCls="bg-amber-50"
          colorCls="text-amber-500"
        />
      )}
    </div>
  )
}

function StatusCard({ icon, label, count, items, borderCls, bgCls, colorCls }: {
  icon: React.ReactNode
  label: string
  count: number
  items: Equipment[]
  borderCls: string
  bgCls: string
  colorCls: string
}) {
  return (
    <div className={`flex-1 rounded-xl border-2 p-4 ${borderCls} ${bgCls}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-xs font-bold tracking-widest uppercase ${colorCls}`}>{label}</span>
      </div>
      <p className={`text-4xl font-bold mb-2 ${colorCls}`}>{count}</p>
      <p className="text-xs text-gray-500 leading-relaxed">
        {items.map(i => i.name).join(' · ')}
      </p>
    </div>
  )
}
