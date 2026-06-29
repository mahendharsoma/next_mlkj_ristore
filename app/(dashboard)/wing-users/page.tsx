'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Wing { ps_department_id: number; name: string }
interface StaffMember { admin_id: number; name: string; email: string }
interface WingUser { wing_user_id: number; user_id: number; user_name: string; email: string; wing_name: string; ps_department_id: number; status: string }

export default function WingUsersPage() {
  const [items, setItems] = useState<WingUser[]>([])
  const [wings, setWings] = useState<Wing[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<WingUser | null>(null)
  const [form, setForm] = useState({ user_id: '', ps_department_id: '' })

  const load = () => fetch('/api/wing-users').then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  useEffect(() => {
    load()
    fetch('/api/ps').then(r => r.json()).then(d => { if (d.success) setWings(d.data) })
    fetch('/api/staff').then(r => r.json()).then(d => { if (d.success) setStaffList(d.data) })
  }, [])

  const save = async () => {
    if (!form.user_id || !form.ps_department_id) return toast.error('Select staff and wing')
    const url = editing ? `/api/wing-users/${editing.wing_user_id}` : '/api/wing-users'
    const method = editing ? 'PUT' : 'POST'
    const body = { user_id: Number(form.user_id), ps_department_id: Number(form.ps_department_id), status: 'Active' }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const d = await res.json()
    if (d.success) { toast.success('Saved'); setShowModal(false); load() } else toast.error('Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete this wing user?')) return
    await fetch(`/api/wing-users/${id}`, { method: 'DELETE' })
    toast.success('Deleted'); load()
  }

  const toggleStatus = async (u: WingUser) => {
    const newStatus = u.status === 'Active' ? 'Inactive' : 'Active'
    const res = await fetch(`/api/wing-users/${u.wing_user_id}/status`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    const d = await res.json()
    if (d.success) { toast.success('Status updated'); load() } else toast.error('Error')
  }

  const openAdd = () => { setEditing(null); setForm({ user_id: '', ps_department_id: '' }); setShowModal(true) }
  const openEdit = (u: WingUser) => {
    setEditing(u)
    setForm({ user_id: String(u.user_id), ps_department_id: String(u.ps_department_id) })
    setShowModal(true)
  }

  return (
    <div>
      <PageHeader title="Wing Users" subtitle="Assign staff to wings and police stations" onAdd={openAdd} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Staff Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Wing / PS</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((u, i) => (
              <tr key={u.wing_user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{u.user_name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">{u.wing_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(u)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => toggleStatus(u)} className="text-yellow-500 hover:text-yellow-700">
                      {u.status === 'Active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    </button>
                    <button onClick={() => del(u.wing_user_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No wing users found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Wing User' : 'Add Wing User'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Staff Member</label>
                <select value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Staff</option>
                  {staffList.map(s => <option key={s.admin_id} value={s.admin_id}>{s.name} ({s.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Wing / PS</label>
                <select value={form.ps_department_id} onChange={e => setForm({ ...form, ps_department_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Wing / PS</option>
                  {wings.map(w => <option key={w.ps_department_id} value={w.ps_department_id}>{w.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
