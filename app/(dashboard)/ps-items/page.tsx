'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface PS { ps_department_id: number; name: string }
interface PSItem { ps_item_id: number; product_name: string; unit: string; stock: number; condemned_stock: number; ps_name: string }

export default function PSItemsPage() {
  const [psList, setPsList] = useState<PS[]>([])
  const [items, setItems] = useState<PSItem[]>([])
  const [selectedPs, setSelectedPs] = useState('')

  useEffect(() => {
    fetch('/api/ps').then(r => r.json()).then(d => { if (d.success) setPsList(d.data) })
  }, [])

  useEffect(() => {
    if (!selectedPs) { setItems([]); return }
    fetch(`/api/ps-items?ps_id=${selectedPs}`).then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  }, [selectedPs])

  return (
    <div>
      <PageHeader title="PS / Wing Items" subtitle="View stock at each police station or department" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <select value={selectedPs} onChange={e => setSelectedPs(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
              {/* <th className="px-4 py-3 text-left">Unit</th> */}
              <th className="px-4 py-3 text-left">Available Stock</th>
              {/* <th className="px-4 py-3 text-left">Condemned Stock</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={item.ps_item_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{item.product_name}</td>
                {/* <td className="px-4 py-3 text-gray-600">{item.unit || '—'}</td> */}
                <td className="px-4 py-3 font-semibold text-green-700">{item.stock ?? 0}</td>
                {/* <td className="px-4 py-3 font-semibold text-red-600">{item.condemned_stock ?? 0}</td> */}
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Select a PS / Department to view items</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
