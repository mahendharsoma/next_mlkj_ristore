'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Role { role_id: number; role_name: string }

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState('')

  const load = () => fetch('/api/roles').then(r => r.json()).then(d => { if (d.success) setRoles(d.data) })
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditing(null); setRoleName(''); setShowModal(true) }
  const openEdit = (r: Role) => { setEditing(r); setRoleName(r.role_name); setShowModal(true) }

  const save = async () => {
    const url = editing ? `/api/roles/${editing.role_id}` : '/api/roles'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role_name: roleName }) })
    const d = await res.json()
    if (d.success) { toast.success('Saved'); setShowModal(false); load() } else toast.error('Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete this role?')) return
    const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' })
    const d = await res.json()
    if (d.success) { toast.success('Deleted'); load() } else toast.error('Error')
  }

  return (
    <div>
      <PageHeader title="Roles" subtitle="Manage user roles" onAdd={openAdd} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Role Name</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roles.map((r, i) => (
              <tr key={r.role_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{r.role_name}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => del(r.role_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No roles found</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Role' : 'Add Role'}</h2>
            <input placeholder="Role Name" value={roleName} onChange={e => setRoleName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
