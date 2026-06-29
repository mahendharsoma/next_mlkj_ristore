'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Category { category_id: number; category_name: string }

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')

  const load = () => fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  useEffect(() => { load() }, [])

  const save = async () => {
    const url = editing ? `/api/categories/${editing.category_id}` : '/api/categories'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category_name: name }) })
    const d = await res.json()
    if (d.success) { toast.success('Saved'); setShowModal(false); load() } else toast.error('Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    toast.success('Deleted'); load()
  }

  return (
    <div>
      <PageHeader title="Categories" onAdd={() => { setEditing(null); setName(''); setShowModal(true) }} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr><th className="px-4 py-3 text-left">#</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((c, i) => (
              <tr key={c.category_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{c.category_name}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => { setEditing(c); setName(c.category_name); setShowModal(true) }} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(c.category_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No categories found</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Category' : 'Add Category'}</h2>
            <input placeholder="Category Name" value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
