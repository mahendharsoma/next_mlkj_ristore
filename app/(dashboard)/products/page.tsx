'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Product { product_id: number; product_name: string; category_id: number; category_name: string; stock_flag: number; status: string }
interface Category { category_id: number; category_name: string }

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ product_name: '', category_id: '', stock_flag: '0', status: 'Active' })
  const [filterCat, setFilterCat] = useState('')

  const load = (cat?: string) => {
    const url = cat ? `/api/products?category_id=${cat}` : '/api/products'
    fetch(url).then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  }
  useEffect(() => {
    load()
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setCats(d.data) })
  }, [])

  const save = async () => {
    const url = editing ? `/api/products/${editing.product_id}` : '/api/products'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.success) { toast.success('Saved'); setShowModal(false); load(filterCat) } else toast.error('Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    toast.success('Deleted'); load(filterCat)
  }

  return (
    <div>
      <PageHeader title="Products" onAdd={() => { setEditing(null); setForm({ product_name: '', category_id: '', stock_flag: '0', status: 'Active' }); setShowModal(true) }} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <select value={filterCat} onChange={e => { setFilterCat(e.target.value); load(e.target.value) }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Stock Flag</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((p, i) => (
              <tr key={p.product_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{p.product_name}</td>
                <td className="px-4 py-3">{p.category_name}</td>
                <td className="px-4 py-3">{p.stock_flag}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => { setEditing(p); setForm({ product_name: p.product_name, category_id: String(p.category_id), stock_flag: String(p.stock_flag), status: p.status || 'Active' }); setShowModal(true) }} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(p.product_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No products</td></tr>}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Product' : 'Add Product'}</h2>
            <div className="space-y-3">
              <input placeholder="Product Name" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Category</option>
                {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
              <input type="number" placeholder="Stock Flag" value={form.stock_flag} onChange={e => setForm({ ...form, stock_flag: e.target.value })}
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
