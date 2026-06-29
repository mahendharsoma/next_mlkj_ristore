'use client'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface PurchaseOrder { purchase_order_id: number; number: string; vendor_name: string }
interface AddedItem { transaction_id: number; item_id: number; product_id: number; product_name: string; category_name: string; price: number; quantity: number; added_on: string }

export default function ItemsAddedDataPage() {
  const [poList, setPoList] = useState<PurchaseOrder[]>([])
  const [items, setItems] = useState<AddedItem[]>([])
  const [selectedPo, setSelectedPo] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    fetch('/api/purchase-orders').then(r => r.json()).then(d => { if (d.success) setPoList(d.data) })
  }, [])

  const search = () => {
    if (!selectedPo || !fromDate || !toDate) return
    fetch(`/api/items-added-data?purchase_order_id=${selectedPo}&from_date=${fromDate}&to_date=${toDate}`)
      .then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  }

  const formatDate = (v?: string) => {
    if (!v) return '—'
    const d = new Date(v)
    if (isNaN(d.getTime())) return v.split(' ')[0] || '—'
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <PageHeader title="Items Added Data" subtitle="View purchase order items received within a date range" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">Purchase Order</label>
            <select value={selectedPo} onChange={e => setSelectedPo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Purchase Order</option>
              {poList.map(po => <option key={po.purchase_order_id} value={po.purchase_order_id}>{po.number} {po.vendor_name ? `— ${po.vendor_name}` : ''}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={search}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Price</th>
              <th className="px-4 py-3 text-left">Quantity</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={item.transaction_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3">{item.category_name || '—'}</td>
                <td className="px-4 py-3 font-medium">{item.product_name || '—'}</td>
                <td className="px-4 py-3">{item.price || '—'}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{formatDate(item.added_on)}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Select purchase order and date range, then search</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
