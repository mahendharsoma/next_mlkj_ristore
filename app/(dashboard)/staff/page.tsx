'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, KeyRound, ToggleLeft, ToggleRight, Lock } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Staff { admin_id: number; name: string; email: string; phone: string; status: string; roles: string; role_ids: string | null; created_on: string }
interface Role { role_id: number; role_name: string }

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role_ids: [] as number[] })
  const [search, setSearch] = useState('')
  const [showPwModal, setShowPwModal] = useState(false)
  const [pwTargetId, setPwTargetId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState('')

  const load = () => {
    fetch('/api/staff').then(r => r.json()).then(d => { if (d.success) setStaff(d.data) })
    fetch('/api/roles').then(r => r.json()).then(d => { if (d.success) setRoles(d.data) })
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setForm({ name: '', email: '', phone: '', role_ids: [] }); setShowModal(true) }
  const openEdit = (s: Staff) => {
    setEditing(s)
    const roleIds = s.role_ids ? s.role_ids.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id)) : []
    setForm({ name: s.name, email: s.email, phone: s.phone, role_ids: roleIds })
    setShowModal(true)
  }

  const save = async () => {
    const url = editing ? `/api/staff/${editing.admin_id}` : '/api/staff'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.success) { toast.success(editing ? 'Staff updated' : `Staff added. Password: ${d.data?.password}`); setShowModal(false); load() }
    else toast.error(d.message || 'Error')
  }

  const changePassword = async () => {
    if (!pwTargetId || !newPassword) return
    const res = await fetch(`/api/staff/${pwTargetId}/password`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    })
    const d = await res.json()
    if (d.success) { toast.success('Password changed'); setShowPwModal(false); setNewPassword('') }
    else toast.error('Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete this staff member?')) return
    const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
    const d = await res.json()
    if (d.success) { toast.success('Deleted'); load() } else toast.error('Error')
  }

  const toggleStatus = async (s: Staff) => {
    const newStatus = s.status === 'Active' ? 'Inactive' : 'Active'
    const res = await fetch(`/api/staff/${s.admin_id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) })
    const d = await res.json()
    if (d.success) { toast.success('Status updated'); load() } else toast.error('Error')
  }

  const filtered = staff.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <PageHeader title="Staff Management" subtitle="Manage system users" onAdd={openAdd} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..."
            className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Roles</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s, i) => (
                <tr key={s.admin_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.email}</td>
                  <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{s.roles || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => toggleStatus(s)} className="text-yellow-500 hover:text-yellow-700">
                        {s.status === 'Active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setPwTargetId(s.admin_id); setNewPassword(''); setShowPwModal(true) }} className="text-purple-500 hover:text-purple-700"><Lock className="w-4 h-4" /></button>
                      <button onClick={() => del(s.admin_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No staff found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPwModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>
            <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={changePassword} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => setShowPwModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{editing ? 'Edit Staff' : 'Add Staff'}</h2>
            <div className="space-y-3">
              <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Roles</label>
                <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {roles.map(r => (
                    <label key={r.role_id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.role_ids.includes(r.role_id)}
                        onChange={e => setForm({ ...form, role_ids: e.target.checked ? [...form.role_ids, r.role_id] : form.role_ids.filter(id => id !== r.role_id) })} />
                      {r.role_name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
