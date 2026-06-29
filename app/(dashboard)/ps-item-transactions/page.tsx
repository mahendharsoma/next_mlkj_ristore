'use client'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface PS { ps_department_id: number; name: string }
interface Transaction { transaction_id: number; product_id: number; product_name: string; quantity: number; added_on: string }

const today = () => new Date().toISOString().split('T')[0]
const last30Days = () => {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().split('T')[0]
}

export default function PsItemTransactionsPage() {
  const [psList, setPsList] = useState<PS[]>([])
  const [items, setItems] = useState<Transaction[]>([])
  const [selectedPs, setSelectedPs] = useState('')
  const [fromDate, setFromDate] = useState(last30Days())
  const [toDate, setToDate] = useState(today())

  useEffect(() => {
    fetch('/api/ps').then(r => r.json()).then(d => { if (d.success) setPsList(d.data) })
  }, [])

  const load = () => {
    if (!selectedPs) { setItems([]); return }
    fetch(`/api/ps-item-transactions?ps_id=${selectedPs}&from_date=${fromDate}&to_date=${toDate}`)
      .then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  }

  useEffect(() => {
    load()
  }, [selectedPs])

  const search = () => load()

  const formatDate = (v?: string) => {
    if (!v) return '—'
    const d = new Date(v)
    if (isNaN(d.getTime())) return v
    return d.toISOString().replace('T', ' ').slice(0, 19)
  }

  return (
    <div>
      <PageHeader title="PS Item Transactions" subtitle="PS-wise transaction history" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">PS / Department</label>
            <select value={selectedPs} onChange={e => setSelectedPs(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select PS</option>
              {psList.map(p => <option key={p.ps_department_id} value={p.ps_department_id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={search}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Quantity</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={item.transaction_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{item.product_name || '—'}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{formatDate(item.added_on)}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Select PS to view transactions</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
