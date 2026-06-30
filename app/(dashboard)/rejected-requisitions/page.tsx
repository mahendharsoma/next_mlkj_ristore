'use client'
import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/ui/PageHeader'

interface Req { requisition_id: number; product: string; quantity: number; reason_for_requisition: string; status: string; vendor_name: string; created_on: string }

const STATUS_COLORS: Record<string, string> = {
  Rejected: 'bg-red-100 text-red-700',
}

export default function RejectedRequisitionsPage() {
  const [items, setItems] = useState<Req[]>([])
  const [showReopenModal, setShowReopenModal] = useState(false)
  const [reopeningId, setReopeningId] = useState<number | null>(null)

  const load = () => fetch('/api/requisitions?status=Rejected').then(r => r.json()).then(d => { if (d.success) setItems(d.data) })

  useEffect(() => { load() }, [])

  const restore = async (id: number) => {
    const res = await fetch(`/api/requisitions/${id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Requisition' })
    })
    const d = await res.json()
    if (d.success) {
      toast.success('Requisition status has been changed successfully.')
      load()
    }
  }

  const openReopenModal = (id: number) => {
    setReopeningId(id)
    setShowReopenModal(true)
  }

  const confirmReopen = () => {
    if (reopeningId) {
      restore(reopeningId)
      setShowReopenModal(false)
      setReopeningId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Rejected Requisitions" subtitle="Requisitions marked as rejected" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Qty</th>
              <th className="px-4 py-3 text-left">Reason</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((r, i) => (
              <tr key={r.requisition_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{r.product}</td>
                <td className="px-4 py-3">{r.quantity}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.reason_for_requisition}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-gray-100 text-gray-700'}`}>{r.status}</span></td>
                <td className="px-4 py-3">
                  <button onClick={() => openReopenModal(r.requisition_id)} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium">Reopen</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No rejected requisitions</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Reopen Confirmation Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Reopen Requisition</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to change the status of this requisition from <strong>Rejected</strong> to <strong>Requisition</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmReopen}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowReopenModal(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
