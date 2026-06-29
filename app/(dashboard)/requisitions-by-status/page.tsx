'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Req { requisition_id: number; product: string; quantity: number; reason_for_requisition: string; status: string; vendor_id?: number; vendor_name: string; amount?: number; po_number?: string; po_date?: string; rv_number?: string; rv_date?: string; created_on: string }

const STATUS_COLORS: Record<string, string> = {
  Requisition: 'bg-blue-100 text-blue-700',
  Permitted: 'bg-indigo-100 text-indigo-700',
  Quotation: 'bg-purple-100 text-purple-700',
  Committee: 'bg-pink-100 text-pink-700',
  Approved: 'bg-green-100 text-green-700',
  PO: 'bg-orange-100 text-orange-700',
  'File Transfer to Superdent Store': 'bg-teal-100 text-teal-700',
  Rejected: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  'File Transfer to Superdent Store': 'File Transfer to Superintendent Store',
}

const STATUSES = ['All', 'Requisition', 'Permitted', 'Quotation', 'Committee', 'Approved', 'PO', 'File Transfer to Superdent Store', 'Rejected']

export default function RequisitionsByStatusPage() {
  const [items, setItems] = useState<Req[]>([])
  const [status, setStatus] = useState('All')

  const load = (s: string) => {
    const url = s === 'All' ? '/api/requisitions' : `/api/requisitions?status=${encodeURIComponent(s)}`
    fetch(url).then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  }

  useEffect(() => { load(status) }, [status])

  const toDateInput = (v?: string) => {
    if (!v) return ''
    const d = new Date(v)
    if (isNaN(d.getTime())) return v.split(' ')[0] || ''
    return d.toISOString().split('T')[0]
  }
  const formatDate = (v?: string) => toDateInput(v) || '—'

  const del = async (id: number) => {
    if (!confirm('Delete?')) return
    await fetch(`/api/requisitions/${id}`, { method: 'DELETE' })
    toast.success('Deleted'); load(status)
  }

  return (
    <div>
      <PageHeader title="Requisitions by Status" subtitle="View requisitions grouped by status" />
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${status === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {STATUS_LABEL[s] || s}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Requisition From</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Quantity</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">PO No</th>
              <th className="px-4 py-3 text-left">PO Date</th>
              <th className="px-4 py-3 text-left">Rv No</th>
              <th className="px-4 py-3 text-left">Rv Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((r, i) => (
              <tr key={r.requisition_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.reason_for_requisition}</td>
                <td className="px-4 py-3 font-medium">{r.product}</td>
                <td className="px-4 py-3">{r.quantity || 0}</td>
                <td className="px-4 py-3">{r.vendor_name || ''}</td>
                <td className="px-4 py-3">{r.amount || ''}</td>
                <td className="px-4 py-3">{r.po_number || ''}</td>
                <td className="px-4 py-3">{formatDate(r.po_date)}</td>
                <td className="px-4 py-3">{r.rv_number || ''}</td>
                <td className="px-4 py-3">{formatDate(r.rv_date)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-700'}`}>{STATUS_LABEL[r.status] || r.status}</span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => del(r.requisition_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">No requisitions found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
