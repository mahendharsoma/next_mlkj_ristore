'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Vendor { vendor_id: number; vendor_name: string; vendor_phone: string; vendor_address: string }

export default function VendorsPage() {
  const [items, setItems] = useState<Vendor[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [form, setForm] = useState({ vendor_name: '', vendor_phone: '', vendor_address: '' })

  const load = () => fetch('/api/vendors').then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  useEffect(() => { load() }, [])

  const save = async () => {
    // Validation
    if (!form.vendor_name.trim()) { toast.error('Vendor name is required'); return }
    if (!form.vendor_phone.trim()) { toast.error('Phone number is required'); return }
    if (!/^\d{10}$/.test(form.vendor_phone.replace(/\D/g, ''))) { toast.error('Phone number must be 10 digits'); return }
    if (!form.vendor_address.trim()) { toast.error('Address is required'); return }

    const url = editing ? `/api/vendors/${editing.vendor_id}` : '/api/vendors'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.success) { toast.success('Saved'); setShowModal(false); load() } else toast.error('Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete?')) return
    await fetch(`/api/vendors/${id}`, { method: 'DELETE' })
    toast.success('Deleted'); load()
  }

  const openAdd = () => { setEditing(null); setForm({ vendor_name: '', vendor_phone: '', vendor_address: '' }); setShowModal(true) }
  const openEdit = (v: Vendor) => { setEditing(v); setForm({ vendor_name: v.vendor_name, vendor_phone: v.vendor_phone, vendor_address: v.vendor_address }); setShowModal(true) }

  return (
    <div>
      <PageHeader title="Vendors" onAdd={openAdd} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Address</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((v, i) => (
              <tr key={v.vendor_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{v.vendor_name}</td>
                <td className="px-4 py-3">{v.vendor_phone}</td>
                <td className="px-4 py-3">{v.vendor_address}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(v)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(v.vendor_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No vendors found</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Vendor' : 'Add Vendor'}</h2>
            <div className="space-y-3">
              <input placeholder="Vendor Name" value={form.vendor_name} onChange={e => setForm({ ...form, vendor_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="tel" placeholder="Phone Number (10 digits)" value={form.vendor_phone} onChange={e => setForm({ ...form, vendor_phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Address" value={form.vendor_address} onChange={e => setForm({ ...form, vendor_address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
