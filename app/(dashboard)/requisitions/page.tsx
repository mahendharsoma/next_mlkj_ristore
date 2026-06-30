'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Pencil, Trash2, ChevronDown } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Req { requisition_id: number; product: string; quantity: number; reason_for_requisition: string; status: string; vendor_id?: number; vendor_name: string; amount?: string; po_number?: string; po_date?: string; rv_number?: string; rv_date?: string; created_on: string; created_by: number; updated_by?: number; updated_on?: string; rejection_reason?: string }

const STATUS_COLORS: Record<string, string> = {
  Requisition: 'bg-blue-100 text-blue-700',
  Permitted: 'bg-indigo-100 text-indigo-700',
  Quotation: 'bg-purple-100 text-purple-700',
  Committee: 'bg-pink-100 text-pink-700',
  Approved: 'bg-green-100 text-green-700',
  PO: 'bg-orange-100 text-orange-700',
  'File Transfer to Superintendent Store': 'bg-teal-100 text-teal-700',
  Rejected: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  'File Transfer to Superintendent Store': 'Completed',
}

const STATUSES = ['Requisition', 'Permitted', 'Committee',  'PO', 'File Transfer to Superintendent Store']

const NEXT_STATUSES: Record<string, string[]> = {
  Permitted: ['Quotation', 'Sanction', 'TG/TS', 'Tender'],
  Quotation: ['Committee'],
  Committee: ['Approved'],
  Approved: ['PO'],
  PO: ['File Transfer to Superintendent Store'],
}

export default function RequisitionsPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<Req[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [editing, setEditing] = useState<Req | null>(null)
  const [form, setForm] = useState({ product: '', quantity: '', reason_for_requisition: '' })
  const [statusForm, setStatusForm] = useState({ status: '', vendor_id: '', amount: '', po_number: '', po_date: '', rv_number: '', rv_date: '' })
  const [vendors, setVendors] = useState<{ vendor_id: number; vendor_name: string }[]>([])
  const [tab, setTab] = useState('all')

  const userRoles = (session?.user as { roles?: string[] })?.roles || []
  const isAdmin = userRoles.includes('Administrator')
  const canPermit = isAdmin || userRoles.includes('Department Head')
  const canReject = isAdmin || userRoles.includes('Department Head')
  const canGeneratePO = isAdmin || userRoles.includes('Purchase Officer')
  const canComplete = isAdmin || userRoles.includes('Store Officer')

  const load = () => fetch('/api/requisitions').then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  useEffect(() => {
    load()
    fetch('/api/vendors').then(r => r.json()).then(d => { if (d.success) setVendors(d.data) })
  }, [])

  const save = async () => {
    const url = '/api/requisitions'
    const method = editing ? 'PUT' : 'POST'
    const payload = editing ? { ...form, requisition_id: editing.requisition_id } : form
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const d = await res.json()
    if (d.success) { toast.success('Saved'); setShowModal(false); load() } else toast.error('Error')
  }

  const updateStatus = async (status: string) => {
    if (!editing) return

    // Validation for Quotation
    if (status === 'Quotation') {
      if (!statusForm.vendor_id || !statusForm.amount) {
        toast.error('Incomplete Information', {
          description: 'Vendor and Amount are required for Quotation.'
        })
        return
      }
    }

    // Validation for Sanction
    if (status === 'Sanction') {
      if (!statusForm.vendor_id || !statusForm.amount || !statusForm.rv_number || !statusForm.rv_date) {
        toast.error('Incomplete Information', {
          description: 'Vendor, Amount, RV Number, and RV Date are required for Sanction.'
        })
        return
      }
    }

    // Validation for Approved
    if (status === 'Approved') {
      if (!statusForm.po_number || !statusForm.po_date) {
        toast.error('Incomplete Information', {
          description: 'PO Number and PO Date are required for Approved status.'
        })
        return
      }
    }

    // Validation for PO to File Transfer
    if (status === 'File Transfer to Superintendent Store' && editing.status === 'PO') {
      if (!editing.po_number || !editing.po_date || !statusForm.rv_number || !statusForm.rv_date) {
        toast.error('Incomplete Information', {
          description: 'Please complete all required fields (RV Number, and RV Date) before transferring this requisition to File Transfer to Superintendent Store.'
        })
        return
      }
    }

    let endpoint = ''
    let body: any = {}

    switch (status) {
      case 'Quotation':
        endpoint = `/api/requisitions/${editing.requisition_id}/quotation`
        body = { vendor_id: statusForm.vendor_id, amount: statusForm.amount }
        break
      case 'Committee':
        endpoint = `/api/requisitions/${editing.requisition_id}/committee`
        break
      case 'Approved':
        endpoint = `/api/requisitions/${editing.requisition_id}/approve`
        body = { po_number: statusForm.po_number, po_date: statusForm.po_date }
        break
      case 'File Transfer to Superintendent Store':
        endpoint = `/api/requisitions/${editing.requisition_id}/po`
        body = { rv_number: statusForm.rv_number, rv_date: statusForm.rv_date }
        break
      case 'Sanction':
        endpoint = `/api/requisitions/${editing.requisition_id}/sanction`
        body = { vendor_id: statusForm.vendor_id, amount: statusForm.amount, rv_number: statusForm.rv_number, rv_date: statusForm.rv_date }
        break
      case 'TG/TS':
        endpoint = `/api/requisitions/${editing.requisition_id}/tgts`
        break
      case 'Tender':
        endpoint = `/api/requisitions/${editing.requisition_id}/tender`
        break
      default:
        return
    }

    const res = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    })
    const d = await res.json()
    if (d.success) { toast.success(d.message); setShowStatusModal(false); load() } else toast.error(d.message || 'Error')
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
  const setRejected = (id: number) => {
    setRejectingId(id)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const confirmReject = async () => {
    if (!rejectingId || !rejectReason) return
    const res = await fetch(`/api/requisitions/${rejectingId}/reject`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rejection_reason: rejectReason })
    })
    const d = await res.json()
    if (d.success) { toast.success(d.message); setShowRejectModal(false); load() } else toast.error(d.message || 'Error')
  }

  const openStatusModal = (r: Req) => {
    setEditing(r)
    setStatusForm({
      status: '',
      vendor_id: String(r.vendor_id || ''),
      amount: r.amount || '',
      po_number: r.po_number || '',
      po_date: toDateInput(r.po_date),
      rv_number: r.rv_number || '',
      rv_date: toDateInput(r.rv_date),
    })
    setShowStatusModal(true)
  }

  const filtered = tab === 'all' ? items : items.filter(i => i.status === tab)

  const toDateInput = (v?: string) => {
    if (!v) return ''
    const d = new Date(v)
    if (isNaN(d.getTime())) return v.split(' ')[0] || ''
    return d.toISOString().split('T')[0]
  }
  const formatDate = (v?: string | number) => {
    if (!v) return '—'
    const str = typeof v === 'number' ? new Date(v).toISOString().split('T')[0] : String(v)
    return toDateInput(str) || '—'
  }

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
          <thead className="bg-gray-50 text-xs uppercase text-gray-600 font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Quantity</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r, i) => (
              <tr key={r.requisition_id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-500 font-medium">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{r.product}</td>
                <td className="px-4 py-3 text-gray-700">{r.quantity || 0}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={r.reason_for_requisition}>{r.reason_for_requisition}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-700'}`}>{STATUS_LABEL[r.status] || r.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <button onClick={() => { setEditing(r); setForm({ product: r.product, quantity: String(r.quantity), reason_for_requisition: r.reason_for_requisition }); setShowModal(true) }}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => del(r.requisition_id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    {r.status === 'Requisition' && (
                      <>
                        
                          <button onClick={() => setPermitted(r.requisition_id)} className="bg-emerald-600 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-emerald-700 transition font-medium">Permit</button>
                      
                        
                          <button onClick={() => setRejected(r.requisition_id)} className="bg-red-600 text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-700 transition font-medium">Reject</button>
                      
                      </>
                    )}
                    {r.status !== 'Requisition' && r.status !== 'File Transfer to Superintendent Store' && (
                      <button onClick={() => openStatusModal(r)}
                        className="text-orange-500 hover:text-orange-700" title="Status Change"><ChevronDown className="w-4 h-4" /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No requisitions found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Requisition' : 'New Requisition'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Product *</label>
                  <input placeholder="Product name" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Quantity</label>
                  <input placeholder="Quantity" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
             
             
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Reason for Requisition *</label>
                <textarea placeholder="Reason for requisition" value={form.reason_for_requisition} onChange={e => setForm({ ...form, reason_for_requisition: e.target.value })} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition">Save</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (() => {
        const current = editing?.status || ''
        const options = NEXT_STATUSES[current] || []
        const selected = statusForm.status

        // Determine which fields to show based on selected path
        const isQuotation = selected === 'Quotation'
        const isSanction = selected === 'Sanction'
        const isTGOrTender = selected === 'TG/TS' || selected === 'Tender'
        const isCommittee = selected === 'Committee'
        const isApproved = selected === 'Approved'
        const isFileTransferFromPO = selected === 'File Transfer to Superintendent Store' && current === 'PO'

        return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Update Status</h2>
            <div className="space-y-3">
              {options.length === 0 ? (
                <div className="text-sm text-gray-500">No further status change available.</div>
              ) : (
                <select value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Next Process</option>
                  {options.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}

              {/* Quotation: Vendor + Amount */}
              {isQuotation && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Vendor *</label>
                    <select value={statusForm.vendor_id} onChange={e => setStatusForm({ ...statusForm, vendor_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Vendor</option>
                      {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Amount (₹) *</label>
                    <input placeholder="0.00" type="number" step="0.01" value={statusForm.amount} onChange={e => setStatusForm({ ...statusForm, amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}

              {/* Sanction: Vendor + Amount + RV Number + RV Date */}
              {isSanction && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Vendor *</label>
                    <select value={statusForm.vendor_id} onChange={e => setStatusForm({ ...statusForm, vendor_id: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Vendor</option>
                      {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Amount (₹) *</label>
                    <input placeholder="0.00" type="number" step="0.01" value={statusForm.amount} onChange={e => setStatusForm({ ...statusForm, amount: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">RV Number *</label>
                    <input placeholder="RV Number" value={statusForm.rv_number} onChange={e => setStatusForm({ ...statusForm, rv_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">RV Date *</label>
                    <input type="date" value={statusForm.rv_date} onChange={e => setStatusForm({ ...statusForm, rv_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}

              {/* TG/TS or Tender: No fields */}
              {isTGOrTender && (
                <div className="text-sm text-gray-500">This will directly move to File Transfer to Superintendent Store.</div>
              )}

              {/* Committee: No fields */}
              {isCommittee && (
                <div className="text-sm text-gray-500">This will move to Approved status.</div>
              )}

              {/* Approved: PO Number + PO Date */}
              {isApproved && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">PO Number *</label>
                    <input placeholder="PO Number" value={statusForm.po_number} onChange={e => setStatusForm({ ...statusForm, po_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">PO Date *</label>
                    <input type="date" value={statusForm.po_date} onChange={e => setStatusForm({ ...statusForm, po_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}

              {/* PO to File Transfer: RV Number + RV Date */}
              {isFileTransferFromPO && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">RV Number *</label>
                    <input placeholder="RV Number" value={statusForm.rv_number} onChange={e => setStatusForm({ ...statusForm, rv_number: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">RV Date *</label>
                    <input type="date" value={statusForm.rv_date} onChange={e => setStatusForm({ ...statusForm, rv_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => updateStatus(selected)} disabled={!selected} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">Update</button>
              <button onClick={() => setShowStatusModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        </div>
        )
      })()}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-red-600">Reject Requisition</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Reject Reason *</label>
                <textarea
                  placeholder="Please provide a reason for rejection"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={confirmReject}
                disabled={!rejectReason}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Requisition History</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">{formatDate(editing.created_on)}</span>
              </div>
              {editing.updated_on && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="text-gray-700">{formatDate(editing.updated_on)}</span>
                </div>
              )}
              {editing.rejection_reason && (
                <div className="py-2 border-b">
                  <span className="text-gray-500 block mb-1">Rejection Reason</span>
                  <span className="text-gray-700">{editing.rejection_reason}</span>
                </div>
              )}
              {editing.po_number && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">PO Number</span>
                  <span className="text-gray-700">{editing.po_number}</span>
                </div>
              )}
              {editing.po_date && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">PO Date</span>
                  <span className="text-gray-700">{formatDate(editing.po_date)}</span>
                </div>
              )}
              {editing.rv_number && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">RV Number</span>
                  <span className="text-gray-700">{editing.rv_number}</span>
                </div>
              )}
              {editing.rv_date && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-500">RV Date</span>
                  <span className="text-gray-700">{formatDate(editing.rv_date)}</span>
                </div>
              )}
            </div>
            <button onClick={() => setShowHistoryModal(false)} className="w-full mt-5 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
