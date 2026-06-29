'use client'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Printer, Plus, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import { useReactToPrint } from 'react-to-print'

interface Wing { ps_department_id: number; name: string }
interface Category { category_id: number; category_name: string }
interface Product { product_id: number; product_name: string; unit: string; category_id: number }
interface IndentItem { indent_item_id: number; category_id: number; product_id: number; category_name: string; product_name: string; order_stock: number; sent_stock: number; available_stock: number; recived_by: string; general_number: string; status: string }
interface Indent { indent_id: number; indent_name: string; wing_name: string; wing_id: number; indent_date: string; status: string; recived_by: string; general_number: string }

export default function IndentsPage() {
  const [indents, setIndents] = useState<Indent[]>([])
  const [wings, setWings] = useState<Wing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [editing, setEditing] = useState<Indent | null>(null)
  const [editingItem, setEditingItem] = useState<IndentItem | null>(null)
  const [activeIndent, setActiveIndent] = useState<Indent | null>(null)
  const [indentItems, setIndentItems] = useState<IndentItem[]>([])
  const [form, setForm] = useState({ wing_id: '', indent_name: '', indent_date: '', recived_by: '', general_number: '' })
  const [itemForm, setItemForm] = useState({ category_id: '', product_id: '', order_stock: '', recived_by: '', general_number: '' })
  const [sendForm, setSendForm] = useState({ indent_item_id: 0, stock: '', date: '' })
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({ content: () => printRef.current })

  const load = () => fetch('/api/indents').then(r => r.json()).then(d => { if (d.success) setIndents(d.data) })
  const loadItems = (id: number) => fetch(`/api/indent-items?indent_id=${id}`).then(r => r.json()).then(d => { if (d.success) setIndentItems(d.data) })

  const toDateInput = (v?: string) => {
    if (!v) return ''
    const d = new Date(v)
    if (isNaN(d.getTime())) return v.split(' ')[0] || ''
    return d.toISOString().split('T')[0]
  }
  const formatDate = (v?: string) => toDateInput(v) || '—'

  useEffect(() => {
    load()
    fetch('/api/ps').then(r => r.json()).then(d => { if (d.success) setWings(d.data) })
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setCategories(d.data) })
    fetch('/api/products').then(r => r.json()).then(d => { if (d.success) setProducts(d.data) })
  }, [])

  const save = async () => {
    if (!form.wing_id) { toast.error('Please select a wing/department'); return }
    if (!form.indent_name.trim()) { toast.error('Indent name is required'); return }
    if (!form.indent_date) { toast.error('Indent date is required'); return }
    if (!form.recived_by.trim()) { toast.error('Received By is required'); return }
    if (!form.general_number.trim()) { toast.error('General Number is required'); return }

    const url = editing ? `/api/indents/${editing.indent_id}` : '/api/indents'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.success) { toast.success('Saved'); setShowModal(false); load() } else toast.error('Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete indent?')) return
    await fetch(`/api/indents/${id}`, { method: 'DELETE' })
    toast.success('Deleted'); load()
  }

  const resetItemForm = () => setItemForm({
    category_id: '',
    product_id: '',
    order_stock: '',
    recived_by: activeIndent?.recived_by || '',
    general_number: activeIndent?.general_number || ''
  })

  const addItem = async () => {
    if (!activeIndent) return
    if (!activeIndent.recived_by?.trim() || !activeIndent.general_number?.trim()) {
      toast.error('Please save the indent with Received By and General Number first')
      return
    }

    const res = await fetch('/api/indent-items', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        indent_id: activeIndent.indent_id,
        ...itemForm,
        recived_by: itemForm.recived_by || activeIndent.recived_by || '',
        general_number: itemForm.general_number || activeIndent.general_number || ''
      })
    })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) { toast.success('Item added'); resetItemForm(); loadItems(activeIndent.indent_id) }
    else toast.error(d.message || 'Error')
  }

  const saveItem = async () => {
    if (!editingItem) return
    const res = await fetch(`/api/indent-items/${editingItem.indent_item_id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: itemForm.category_id, product_id: itemForm.product_id, order_stock: itemForm.order_stock })
    })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) { toast.success('Item updated'); setShowItemModal(false); setEditingItem(null); resetItemForm(); if (activeIndent) loadItems(activeIndent.indent_id) }
    else toast.error(d.message || 'Error')
  }

  const removeItem = async (itemId: number) => {
    if (!confirm('Remove item?')) return
    const res = await fetch(`/api/indent-items/${itemId}`, { method: 'DELETE' })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) { toast.success('Removed'); if (activeIndent) loadItems(activeIndent.indent_id) }
    else toast.error(d.message || 'Error')
  }

  const openSend = (item: IndentItem) => {
    setSendForm({ indent_item_id: item.indent_item_id, stock: '', date: new Date().toISOString().split('T')[0] })
    setShowSendModal(true)
  }

  const sendStock = async () => {
    const res = await fetch(`/api/indent-items/${sendForm.indent_item_id}/dispatch`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: Number(sendForm.stock), date: sendForm.date })
    })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) { toast.success('Stock sent'); setShowSendModal(false); if (activeIndent) loadItems(activeIndent.indent_id) }
    else toast.error(d.message || 'Error')
  }

  const openEditItem = (item: IndentItem) => {
    setEditingItem(item)
    setItemForm({ category_id: String(item.category_id), product_id: String(item.product_id), order_stock: String(item.order_stock), recived_by: item.recived_by || '', general_number: item.general_number || '' })
    setShowItemModal(true)
  }

  const openItems = (indent: Indent) => {
    setActiveIndent(indent)
    setItemForm({
      category_id: '',
      product_id: '',
      order_stock: '',
      recived_by: indent.recived_by || '',
      general_number: indent.general_number || ''
    })
    loadItems(indent.indent_id)
    setShowItemsModal(true)
  }

  return (
    <div>
      <PageHeader title="Indents" subtitle="Manage stock indents for wings/departments"
        onAdd={() => { setEditing(null); setForm({ wing_id: '', indent_name: '', indent_date: '', recived_by: '', general_number: '' }); setShowModal(true) }} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Indent Name</th>
              <th className="px-4 py-3 text-left">Wing</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Received By</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {indents.map((indent, i) => (
              <tr key={indent.indent_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{indent.indent_name}</td>
                <td className="px-4 py-3">{indent.wing_name}</td>
                <td className="px-4 py-3">{formatDate(indent.indent_date)}</td>
                <td className="px-4 py-3">{indent.recived_by}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${indent.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {indent.status || 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openItems(indent)} className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 bg-green-50 rounded">Items</button>
                    <button onClick={() => { setEditing(indent); setForm({ wing_id: String(indent.wing_id), indent_name: indent.indent_name, indent_date: toDateInput(indent.indent_date), recived_by: indent.recived_by, general_number: indent.general_number }); setShowModal(true) }}
                      className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => del(indent.indent_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {indents.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No indents found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Indent' : 'New Indent'}</h2>
            <div className="space-y-3">
              <select value={form.wing_id} onChange={e => setForm({ ...form, wing_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Wing / Department</option>
                {wings.map(w => <option key={w.ps_department_id} value={w.ps_department_id}>{w.name}</option>)}
              </select>
              <input placeholder="Indent Name" value={form.indent_name} onChange={e => setForm({ ...form, indent_name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" value={form.indent_date} onChange={e => setForm({ ...form, indent_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Received By" value={form.recived_by} onChange={e => setForm({ ...form, recived_by: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="General Number" value={form.general_number} onChange={e => setForm({ ...form, general_number: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showItemsModal && activeIndent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Indent Items — {activeIndent.indent_name}</h2>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg">
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button onClick={() => setShowItemsModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
              <select value={itemForm.category_id} onChange={e => setItemForm({ ...itemForm, category_id: e.target.value, product_id: '' })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Category</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
              <select value={itemForm.product_id} onChange={e => setItemForm({ ...itemForm, product_id: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Product</option>
                {products.filter(p => String(p.category_id) === itemForm.category_id).map(p => <option key={p.product_id} value={p.product_id}>{p.product_name} ({p.unit})</option>)}
              </select>
              <input type="number" placeholder="Qty" value={itemForm.order_stock} onChange={e => setItemForm({ ...itemForm, order_stock: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="Recived By" value={itemForm.recived_by} onChange={e => setItemForm({ ...itemForm, recived_by: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly={Boolean(activeIndent?.recived_by?.trim() || activeIndent?.general_number?.trim())}
                disabled={Boolean(activeIndent?.recived_by?.trim() || activeIndent?.general_number?.trim())} />
              <input placeholder="General Number" value={itemForm.general_number} onChange={e => setItemForm({ ...itemForm, general_number: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly={Boolean(activeIndent?.recived_by?.trim() || activeIndent?.general_number?.trim())}
                disabled={Boolean(activeIndent?.recived_by?.trim() || activeIndent?.general_number?.trim())} />
              <button onClick={addItem} className="md:col-span-5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-1">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div ref={printRef} className="print-area">
              <div className="hidden print:block mb-4">
                <h2 className="text-xl font-bold">Indent Receipt</h2>
                <p className="text-sm">Indent: {activeIndent.indent_name} | Wing: {activeIndent.wing_name} | Date: {activeIndent.indent_date}</p>
              </div>
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">Ordered</th>
                    <th className="px-3 py-2 text-left">Sent</th>
                    <th className="px-3 py-2 text-left">Available</th>
                    <th className="px-3 py-2 text-left">Recived By</th>
                    <th className="px-3 py-2 text-left">General No</th>
                    <th className="px-3 py-2 text-left print:hidden">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {indentItems.map((item, idx) => (
                    <tr key={item.indent_item_id}>
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2">{item.category_name}</td>
                      <td className="px-3 py-2 font-medium">{item.product_name}</td>
                      <td className="px-3 py-2">{item.order_stock}</td>
                      <td className="px-3 py-2">{item.sent_stock}</td>
                      <td className="px-3 py-2">
                        <span className={item.available_stock < item.order_stock ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                          {item.available_stock}
                        </span>
                      </td>
                      <td className="px-3 py-2">{item.recived_by || '—'}</td>
                      <td className="px-3 py-2">{item.general_number || '—'}</td>
                      <td className="px-3 py-2 print:hidden">
                        <div className="flex gap-1">
                          {/* <button onClick={() => openSend(item)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded">Send</button> */}
                          <button onClick={() => removeItem(item.indent_item_id)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {indentItems.length === 0 && (
                    <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No items added</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Indent Item</h2>
            <div className="space-y-3">
              <select value={itemForm.category_id} onChange={e => setItemForm({ ...itemForm, category_id: e.target.value, product_id: '' })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
              <select value={itemForm.product_id} onChange={e => setItemForm({ ...itemForm, product_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Product</option>
                {products.filter(p => String(p.category_id) === itemForm.category_id).map(p => <option key={p.product_id} value={p.product_id}>{p.product_name} ({p.unit})</option>)}
              </select>
              <input type="number" placeholder="Order Stock" value={itemForm.order_stock} onChange={e => setItemForm({ ...itemForm, order_stock: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveItem} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowItemModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Send Stock</h2>
            <div className="space-y-3">
              <input type="number" placeholder="Stock" value={sendForm.stock} onChange={e => setSendForm({ ...sendForm, stock: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" value={sendForm.date} onChange={e => setSendForm({ ...sendForm, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={sendStock} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm">Save</button>
              <button onClick={() => setShowSendModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
