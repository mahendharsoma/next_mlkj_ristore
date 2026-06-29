'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface PS { ps_department_id: number; name: string }
interface Condemnation { transaction_id: number; product_id: number; product_name: string; quantity: number; added_on: string; created_on: string }

export default function CondemnationListPage() {
  const [psList, setPsList] = useState<PS[]>([])
  const [selectedPs, setSelectedPs] = useState('')
  const [items, setItems] = useState<Condemnation[]>([])

  useEffect(() => {
    fetch('/api/ps').then(r => r.json()).then(d => { if (d.success) setPsList(d.data) })
  }, [])

  useEffect(() => {
    if (!selectedPs) { setItems([]); return }
    fetch(`/api/ps-items/condemnations?ps_id=${selectedPs}`).then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  }, [selectedPs])

  const formatDate = (v?: string) => {
    if (!v) return '—'
    const d = new Date(v)
    return isNaN(d.getTime()) ? v.split(' ')[0] : d.toISOString().split('T')[0]
  }

  return (
    <div>
      <PageHeader title="Condemnation List" subtitle="View condemned stock by PS/department" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <select value={selectedPs} onChange={e => setSelectedPs(e.target.value)}
          className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select PS / Department</option>
          {psList.map(p => <option key={p.ps_department_id} value={p.ps_department_id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Quantity</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={item.transaction_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{item.product_name}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{formatDate(item.added_on || item.created_on)}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Select PS to view condemned items</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
