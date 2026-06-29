'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, ChevronDown } from 'lucide-react'
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

const STATUSES = ['Requisition', 'Permitted', 'Quotation', 'Committee', 'Approved', 'PO', 'File Transfer to Superdent Store', 'Rejected']

const NEXT_STATUSES: Record<string, string[]> = {
  Permitted: ['Quotation', 'Sanction', 'TG/TS', 'Tender'],
  Quotation: ['Committee'],
  Committee: ['Approved'],
  Approved: ['PO'],
  PO: ['File Transfer to Superdent Store'],
}

export default function RequisitionsPage() {
  const [items, setItems] = useState<Req[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [editing, setEditing] = useState<Req | null>(null)
  const [form, setForm] = useState({ product: '', quantity: '', reason_for_requisition: '' })
  const [statusForm, setStatusForm] = useState({ status: '', vendor_id: '', amount: '', po_number: '', po_date: '', rv_number: '', rv_date: '' })
  const [vendors, setVendors] = useState<{ vendor_id: number; vendor_name: string }[]>([])
  const [tab, setTab] = useState('all')

  const load = () => fetch('/api/requisitions').then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  useEffect(() => {
    load()
    fetch('/api/vendors').then(r => r.json()).then(d => { if (d.success) setVendors(d.data) })
  }, [])

  const save = async () => {
    const url = editing ? `/api/requisitions/${editing.requisition_id}` : '/api/requisitions'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.success) { toast.success('Saved'); setShowModal(false); load() } else toast.error('Error')
  }

  const updateStatus = async (finalStatus?: string) => {
    if (!editing) return
    const payload = finalStatus ? { ...statusForm, status: finalStatus } : statusForm
    const res = await fetch(`/api/requisitions/${editing.requisition_id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) { toast.success('Status updated'); setShowStatusModal(false); load() } else toast.error(d.message || 'Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete?')) return
    await fetch(`/api/requisitions/${id}`, { method: 'DELETE' })
    toast.success('Deleted'); load()
  }

  const updateStatusDirect = async (id: number, status: string) => {
    const res = await fetch(`/api/requisitions/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
    })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) { toast.success('Status updated'); load() } else toast.error(d.message || 'Error')
  }

  const setPermitted = (id: number) => updateStatusDirect(id, 'Permitted')
  const setRejected = (id: number) => updateStatusDirect(id, 'Rejected')

  const openStatusModal = (r: Req) => {
    setEditing(r)
    setStatusForm({ status: '', vendor_id: String(r.vendor_id || ''), amount: String(r.amount || ''), po_number: r.po_number || '', po_date: toDateInput(r.po_date), rv_number: r.rv_number || '', rv_date: toDateInput(r.rv_date) })
    setShowStatusModal(true)
  }

  const filtered = tab === 'all' ? items : items.filter(i => i.status === tab)

  const toDateInput = (v?: string) => {
    if (!v) return ''
    const d = new Date(v)
    if (isNaN(d.getTime())) return v.split(' ')[0] || ''
    return d.toISOString().split('T')[0]
  }
  const formatDate = (v?: string) => toDateInput(v) || '—'

  return (
    <div>
      <PageHeader title="Requisitions" onAdd={() => { setEditing(null); setForm({ product: '', quantity: '', reason_for_requisition: '' }); setShowModal(true) }} />

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${tab === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s === 'all' ? 'All' : s}
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
            {filtered.map((r, i) => (
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
                  <div className="flex gap-2 items-center">
                    <button onClick={() => { setEditing(r); setForm({ product: r.product, quantity: String(r.quantity), reason_for_requisition: r.reason_for_requisition }); setShowModal(true) }}
                      className="text-blue-500 hover:text-blue-700" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => del(r.requisition_id)} className="text-red-500 hover:text-red-700" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    {r.status === 'Requisition' && (
                      <>
                        <button onClick={() => setPermitted(r.requisition_id)} className="bg-green-600 text-white text-xs px-2 py-1 rounded" title="Permit">PR</button>
                        <button onClick={() => setRejected(r.requisition_id)} className="bg-red-600 text-white text-xs px-2 py-1 rounded" title="Reject">RJ</button>
                      </>
                    )}
                    {r.status !== 'Requisition' && r.status !== 'File Transfer to Superdent Store' && (
                      <button onClick={() => openStatusModal(r)}
                        className="text-orange-500 hover:text-orange-700" title="Status Change"><ChevronDown className="w-4 h-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">No requisitions found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Requisition' : 'New Requisition'}</h2>
            <div className="space-y-3">
              <label className="text-sm font-medium">Product *</label>
              <input placeholder="Products" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <label className="text-sm font-medium">Quantity</label>
              <input placeholder="Quantity" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <label className="text-sm font-medium">Requisition From *</label>
              <textarea placeholder="Requisition From" value={form.reason_for_requisition} onChange={e => setForm({ ...form, reason_for_requisition: e.target.value })} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (() => {
        const current = editing?.status || ''
        const options = NEXT_STATUSES[current] || []
        const selected = statusForm.status
        const finalStatus = ['Sanction', 'TG/TS', 'Tender'].includes(selected) ? 'File Transfer to Superdent Store' : selected
        const showVendor = selected === 'Committee' || selected === 'Sanction'
        const showAmount = selected === 'Committee' || selected === 'Sanction'
        const showPO = selected === 'PO'
        const showRV = selected === 'Sanction' || selected === 'TG/TS' || selected === 'Tender' || selected === 'File Transfer to Superdent Store' || selected === 'PO'
        return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Update Status</h2>
            <div className="space-y-3">
              {options.length === 0 ? (
                <div className="text-sm text-gray-500">No further status change available.</div>
              ) : (
                <select value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Status</option>
                  {options.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
              {(showVendor || showAmount) && (
                <>
                  {showVendor && (
                    <select value={statusForm.vendor_id} onChange={e => setStatusForm({ ...statusForm, vendor_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Vendor</option>
                      {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>)}
                    </select>
                  )}
                  {showAmount && (
                    <input placeholder="Amount" type="number" value={statusForm.amount} onChange={e => setStatusForm({ ...statusForm, amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  )}
                </>
              )}
              <div className="grid grid-cols-2 gap-2">
                {showPO && (
                  <>
                    <input placeholder="PO Number" value={statusForm.po_number} onChange={e => setStatusForm({ ...statusForm, po_number: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="date" value={statusForm.po_date} onChange={e => setStatusForm({ ...statusForm, po_date: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </>
                )}
                {showRV && (
                  <>
                    <input placeholder="RV Number" value={statusForm.rv_number} onChange={e => setStatusForm({ ...statusForm, rv_number: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="date" value={statusForm.rv_date} onChange={e => setStatusForm({ ...statusForm, rv_date: e.target.value })}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => updateStatus(finalStatus)} disabled={!selected} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm disabled:opacity-50">Update</button>
              <button onClick={() => setShowStatusModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
        )
      })()}
    </div>
  )
}
