'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, X } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Vendor { vendor_id: number; vendor_name: string }
interface Category { category_id: number; category_name: string }
interface Product { product_id: number; product_name: string; category_id: number; category_name: string; stock_flag: number; status: string }
interface PO { purchase_order_id: number; number: string; vendor_id: number; vendor_name: string; status: string }
interface POItem { item_id: number; category_id: number; product_id: number; category_name: string; product_name: string; cost: number; tax: number; final_amount: number; order_stock: number; recived_stock: number; balance_stock: number }
interface Transaction { transaction_id: number; item_id: number; product_id: number; stock: number; added_on: string; price: number; type_of_transaction: string; created_by: number; created_on: string }

export default function PurchaseOrdersPage() {
  const [pos, setPOs] = useState<PO[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showItemsModal, setShowItemsModal] = useState(false)
  const [editing, setEditing] = useState<PO | null>(null)
  const [activePO, setActivePO] = useState<PO | null>(null)
  const [poItems, setPOItems] = useState<POItem[]>([])
  const [form, setForm] = useState({ number: '', vendor_id: '', status: 'Active' })
  const [newItem, setNewItem] = useState({ category_id: '', product_id: '', cost: '', tax: '', final_amount: '', order_stock: '' })
  const [editingItem, setEditingItem] = useState<POItem | null>(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockForm, setStockForm] = useState({ item_id: 0, stock: '', date: '' })
  const [showTransModal, setShowTransModal] = useState(false)
  const [transItems, setTransItems] = useState<Transaction[]>([])

  const load = () => fetch('/api/purchase-orders').then(r => r.json()).then(d => { if (d.success) setPOs(d.data) })
  const loadItems = (id: number) => fetch(`/api/purchase-order-items?purchase_order_id=${id}`).then(r => r.json()).then(d => { if (d.success) setPOItems(d.data) })

  useEffect(() => {
    load()
    fetch('/api/vendors').then(r => r.json()).then(d => { if (d.success) setVendors(d.data) })
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setCategories(d.data) })
    fetch('/api/products').then(r => r.json()).then(d => { if (d.success) setProducts(d.data) })
  }, [])

  const save = async () => {
    const url = editing ? `/api/purchase-orders/${editing.purchase_order_id}` : '/api/purchase-orders'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await res.json()
    if (d.success) { toast.success('Saved'); setShowModal(false); load() } else toast.error('Error')
  }

  const del = async (id: number) => {
    if (!confirm('Delete PO?')) return
    await fetch(`/api/purchase-orders/${id}`, { method: 'DELETE' })
    toast.success('Deleted'); load()
  }

  const filteredProducts = products.filter(p => String(p.category_id) === newItem.category_id)

  const computeFinalAmount = (cost: string, tax: string) => {
    const c = Number(cost) || 0
    const t = Number(tax) || 0
    return (c + (c * t / 100)).toFixed(2)
  }

  const resetItemForm = () => {
    setNewItem({ category_id: '', product_id: '', cost: '', tax: '', final_amount: '', order_stock: '' })
    setEditingItem(null)
  }

  const saveItem = async () => {
    if (!activePO) return
    const payload = {
      purchase_order_id: activePO.purchase_order_id,
      category_id: newItem.category_id,
      product_id: newItem.product_id,
      cost: newItem.cost,
      tax: newItem.tax,
      final_amount: newItem.final_amount || computeFinalAmount(newItem.cost, newItem.tax),
      order_stock: newItem.order_stock
    }
    const url = editingItem ? `/api/purchase-order-items/${editingItem.item_id}` : '/api/purchase-order-items'
    const method = editingItem ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const d = await res.json()
    if (d.success) { toast.success(editingItem ? 'Item updated' : 'Item added'); resetItemForm(); loadItems(activePO.purchase_order_id) }
    else toast.error(d.message || 'Error')
  }

  const startEditItem = (item: POItem) => {
    setEditingItem(item)
    setNewItem({
      category_id: String(item.category_id),
      product_id: String(item.product_id),
      cost: String(item.cost),
      tax: String(item.tax),
      final_amount: String(item.final_amount),
      order_stock: String(item.order_stock)
    })
  }

  const openStockModal = (item: POItem) => {
    setStockForm({ item_id: item.item_id, stock: '', date: new Date().toISOString().split('T')[0] })
    setShowStockModal(true)
  }

  const saveStock = async () => {
    const res = await fetch(`/api/purchase-order-items/${stockForm.item_id}/stock`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: Number(stockForm.stock), date: stockForm.date })
    })
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) {
      toast.success('Stock added')
      setShowStockModal(false)
      if (activePO) loadItems(activePO.purchase_order_id)
    } else toast.error(d.message || 'Error')
  }

  const openTransModal = async (item: POItem) => {
    const res = await fetch(`/api/purchase-order-items/${item.item_id}/transactions`)
    const text = await res.text()
    const d = text ? JSON.parse(text) : { success: false, message: 'Empty response' }
    if (d.success) { setTransItems(d.data); setShowTransModal(true) }
    else toast.error(d.message || 'Error')
  }

  const removeItem = async (id: number) => {
    if (!confirm('Delete item?')) return
    await fetch(`/api/purchase-order-items/${id}`, { method: 'DELETE' })
    if (activePO) loadItems(activePO.purchase_order_id)
  }

  const openItems = (po: PO) => { setActivePO(po); loadItems(po.purchase_order_id); setShowItemsModal(true) }

  return (
    <div>
      <PageHeader title="Purchase Orders" onAdd={() => { setEditing(null); setForm({ number: '', vendor_id: '', status: 'Active' }); setShowModal(true) }} />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">PO Number</th>
              <th className="px-4 py-3 text-left">Vendor</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pos.map((po, i) => (
              <tr key={po.purchase_order_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{po.number}</td>
                <td className="px-4 py-3">{po.vendor_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${po.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {po.status || 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openItems(po)} className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 bg-green-50 rounded">Items</button>
                    <button onClick={() => { setEditing(po); setForm({ number: po.number, vendor_id: String(po.vendor_id), status: po.status || 'Active' }); setShowModal(true) }}
                      className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => del(po.purchase_order_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {pos.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No purchase orders</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit PO' : 'New Purchase Order'}</h2>
            <div className="space-y-3">
              <input placeholder="PO Number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Vendor</option>
                {vendors.map(v => <option key={v.vendor_id} value={v.vendor_id}>{v.vendor_name}</option>)}
              </select>
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

      {showItemsModal && activePO && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">PO Items — {activePO.number}</h2>
              <button onClick={() => setShowItemsModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-4">
              <select value={newItem.category_id} onChange={e => { setNewItem({ ...newItem, category_id: e.target.value, product_id: '' }) }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Category</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
              <select value={newItem.product_id} onChange={e => setNewItem({ ...newItem, product_id: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Product</option>
                {filteredProducts.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
              </select>
              <input type="number" placeholder="Cost" value={newItem.cost} onChange={e => setNewItem({ ...newItem, cost: e.target.value, final_amount: computeFinalAmount(e.target.value, newItem.tax) })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" placeholder="Tax %" value={newItem.tax} onChange={e => setNewItem({ ...newItem, tax: e.target.value, final_amount: computeFinalAmount(newItem.cost, e.target.value) })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="number" placeholder="Final Amt" value={newItem.final_amount} readOnly
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50" />
              <input type="number" placeholder="Order Stock" value={newItem.order_stock} onChange={e => setNewItem({ ...newItem, order_stock: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={saveItem} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1">
                <Plus className="w-4 h-4" /> {editingItem ? 'Update' : 'Add'}
              </button>
              {editingItem && (
                <button onClick={resetItemForm} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
              )}
            </div>
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-left">Cost</th>
                  <th className="px-3 py-2 text-left">Tax</th>
                  <th className="px-3 py-2 text-left">Final Amt</th>
                  <th className="px-3 py-2 text-left">Order</th>
                  <th className="px-3 py-2 text-left">Received</th>
                  <th className="px-3 py-2 text-left">Balance</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {poItems.map(item => (
                  <tr key={item.item_id}>
                    <td className="px-3 py-2">{item.category_name}</td>
                    <td className="px-3 py-2 font-medium">{item.product_name}</td>
                    <td className="px-3 py-2">{item.cost}</td>
                    <td className="px-3 py-2">{item.tax}</td>
                    <td className="px-3 py-2">{item.final_amount}</td>
                    <td className="px-3 py-2">{item.order_stock}</td>
                    <td className="px-3 py-2">{item.recived_stock}</td>
                    <td className="px-3 py-2">{item.balance_stock}</td>
                    <td className="px-3 py-2 flex gap-2">
                      <button onClick={() => startEditItem(item)} className="text-blue-500 hover:text-blue-700"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => openStockModal(item)} className="bg-green-600 text-white text-xs px-2 py-1 rounded">Add Stock</button>
                      <button onClick={() => openTransModal(item)} className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded border border-blue-100">Transactions</button>
                      <button onClick={() => removeItem(item.item_id)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {poItems.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">No items</td></tr>}
              </tbody>
            </table>
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

      {showTransModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Transactions</h2>
              <button onClick={() => setShowTransModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Stock</th>
                  <th className="px-3 py-2 text-left">Price</th>
                  <th className="px-3 py-2 text-left">Added On</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Created On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transItems.map((t, i) => (
                  <tr key={t.transaction_id}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{t.stock}</td>
                    <td className="px-3 py-2">{t.price}</td>
                    <td className="px-3 py-2">{t.added_on}</td>
                    <td className="px-3 py-2">{t.type_of_transaction}</td>
                    <td className="px-3 py-2">{t.created_on}</td>
                  </tr>
                ))}
                {transItems.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No transactions</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
