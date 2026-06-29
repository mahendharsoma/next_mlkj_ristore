'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, X, Package } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Category { category_id: number; category_name: string }
interface Product { product_id: number; product_name: string; category_id: number; category_name: string }
interface Item { item_id: number; category_id: number; product_id: number; category_name: string; product_name: string; order_stock: number; recived_stock: number; balance_stock: number }

export default function ChiefOfficeItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState({ category_id: '', product_id: '', order_stock: '' })
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockForm, setStockForm] = useState({ item_id: 0, stock: '', date: '' })

  const load = () => fetch('/api/chief-office-items').then(r => r.json()).then(d => { if (d.success) setItems(d.data) })

  useEffect(() => {
    load()
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setCategories(d.data) })
    fetch('/api/products').then(r => r.json()).then(d => { if (d.success) setProducts(d.data) })
  }, [])

  const filteredProducts = products.filter(p => String(p.category_id) === form.category_id)

  const resetForm = () => {
    setForm({ category_id: '', product_id: '', order_stock: '' })
    setEditing(null)
  }

  const save = async () => {
    const url = editing ? `/api/chief-office-items/${editing.item_id}` : '/api/chief-office-items'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) { toast.success('Saved'); setShowModal(false); resetForm(); load() }
    else toast.error(d.message || 'Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete?')) return
    const res = await fetch(`/api/chief-office-items/${id}`, { method: 'DELETE' })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) { toast.success('Deleted'); load() }
    else toast.error(d.message || 'Error')
  }

  const openEdit = (item: Item) => {
    setEditing(item)
    setForm({ category_id: String(item.category_id), product_id: String(item.product_id), order_stock: String(item.order_stock) })
    setShowModal(true)
  }

  const openStockModal = (item: Item) => {
    setStockForm({ item_id: item.item_id, stock: '', date: new Date().toISOString().split('T')[0] })
    setShowStockModal(true)
  }

  const saveStock = async () => {
    const res = await fetch(`/api/chief-office-items/${stockForm.item_id}/stock`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: Number(stockForm.stock), date: stockForm.date })
    })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) { toast.success('Stock added'); setShowStockModal(false); load() }
    else toast.error(d.message || 'Error')
  }

  return (
    <div>
      <PageHeader title="Chief Office Items" subtitle="Manage chief office stock items"
        onAdd={() => { resetForm(); setShowModal(true) }} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Order Stock</th>
              <th className="px-4 py-3 text-left">Received</th>
              <th className="px-4 py-3 text-left">Balance</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={item.item_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3">{item.category_name}</td>
                <td className="px-4 py-3 font-medium">{item.product_name}</td>
                <td className="px-4 py-3">{item.order_stock}</td>
                <td className="px-4 py-3">{item.recived_stock}</td>
                <td className="px-4 py-3">{item.balance_stock}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => openStockModal(item)} className="bg-green-600 text-white text-xs px-2 py-1 rounded">Add Stock</button>
                  <button onClick={() => del(item.item_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No items found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Item' : 'Add Item'}</h2>
            <div className="space-y-3">
              <select value={form.category_id} onChange={e => { setForm({ ...form, category_id: e.target.value, product_id: '' }) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
              <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Product</option>
                {filteredProducts.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
              </select>
              <input type="number" placeholder="Order Stock" value={form.order_stock} onChange={e => setForm({ ...form, order_stock: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Add Stock</h2>
            <div className="space-y-3">
              <input type="number" placeholder="Stock" value={stockForm.stock} onChange={e => setStockForm({ ...stockForm, stock: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" value={stockForm.date} onChange={e => setStockForm({ ...stockForm, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveStock} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowStockModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
