'use client'
import { Plus } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  onAdd?: () => void
  addLabel?: string
}

export default function PageHeader({ title, subtitle, onAdd, addLabel = 'Add New' }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {onAdd && (
        <button onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus className="w-4 h-4" />{addLabel}
        </button>
      )}
    </div>
  )
}
