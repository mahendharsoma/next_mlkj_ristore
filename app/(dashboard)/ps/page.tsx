'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface PS { ps_department_id: number; name: string; address: string; status: string }

export default function PSPage() {
  const [items, setItems] = useState<PS[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<PS | null>(null)
  const [form, setForm] = useState({ name: '', address: '', status: 'Active' })

  const load = () => fetch('/api/ps').then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  useEffect(() => { load() }, [])

  const save = async () => {
    const url = editing ? `/api/ps/${editing.ps_department_id}` : '/api/ps'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.success) { toast.success('Saved'); setShowModal(false); load() } else toast.error('Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete?')) return
    await fetch(`/api/ps/${id}`, { method: 'DELETE' })
    toast.success('Deleted'); load()
  }

  return (
    <div>
      <PageHeader title="PS / Departments" subtitle="Manage police stations and departments"
        onAdd={() => { setEditing(null); setForm({ name: '', address: '', status: 'Active' }); setShowModal(true) }} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Address</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((ps, i) => (
              <tr key={ps.ps_department_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{ps.name}</td>
                <td className="px-4 py-3">{ps.address}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ps.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {ps.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(ps); setForm({ name: ps.name, address: ps.address || '', status: ps.status || 'Active' }); setShowModal(true) }}
                      className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => del(ps.ps_department_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No records found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit PS/Dept' : 'Add PS/Dept'}</h2>
            <div className="space-y-3">
              <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
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
