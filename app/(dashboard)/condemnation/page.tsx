'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import PageHeader from '@/components/ui/PageHeader'

interface PS { ps_department_id: number; name: string }
interface Category { category_id: number; category_name: string }
interface PSItem { ps_item_id: number; product_id: number; product_name: string; category_id: number; category_name: string; stock: number; ps_name: string }

export default function CondemnationPage() {
  const [psList, setPsList] = useState<PS[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<PSItem[]>([])
  const [selectedPs, setSelectedPs] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [activeItem, setActiveItem] = useState<PSItem | null>(null)
  const [form, setForm] = useState({ stock: '', date: '' })

  useEffect(() => {
    fetch('/api/ps').then(r => r.json()).then(d => { if (d.success) setPsList(d.data) })
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setCategories(d.data) })
  }, [])

  useEffect(() => {
    if (!selectedPs || !selectedCategory) { setItems([]); return }
    fetch(`/api/ps-items?ps_id=${selectedPs}&category_id=${selectedCategory}`).then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  }, [selectedPs, selectedCategory])

  const openCondemn = (item: PSItem) => {
    setActiveItem(item)
    setForm({ stock: '', date: new Date().toISOString().split('T')[0] })
    setShowModal(true)
  }

  const save = async () => {
    if (!activeItem) return
    const res = await fetch(`/api/ps-items/${activeItem.ps_item_id}/condemn`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: Number(form.stock), date: form.date })
    })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) {
      toast.success('Condemnation recorded')
      setShowModal(false)
      fetch(`/api/ps-items?ps_id=${selectedPs}&category_id=${selectedCategory}`).then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
    } else toast.error(d.message || 'Error')
  }

  return (
    <div>
      <PageHeader title="Condemnation" subtitle="Condemn stock from PS/department" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <select value={selectedPs} onChange={e => setSelectedPs(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select PS / Department</option>
            {psList.map(p => <option key={p.ps_department_id} value={p.ps_department_id}>{p.name}</option>)}
          </select>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={item.ps_item_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{item.product_name}</td>
                <td className="px-4 py-3">{item.category_name}</td>
                <td className="px-4 py-3">{item.stock}</td>
                <td className="px-4 py-3">
                  <button onClick={() => openCondemn(item)} className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg">Condemn</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Select PS and category to view items</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && activeItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Condemn Stock</h2>
            <p className="text-sm text-gray-500 mb-4">{activeItem.product_name} (Stock: {activeItem.stock})</p>
            <div className="space-y-3">
              <input type="number" placeholder="Condemnation Stock" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
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
