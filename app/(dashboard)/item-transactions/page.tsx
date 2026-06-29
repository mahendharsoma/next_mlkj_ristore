'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface Category { category_id: number; category_name: string }
interface Product { product_id: number; product_name: string; total_stock: number; available_stock: number }
interface Transaction { transaction_id: number; stock: number; added_on: string; created_on: string; ps_name: string }

export default function ItemTransactionsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('')

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setCategories(d.data) })
  }, [])

  useEffect(() => {
    if (!selectedCategory) { setProducts([]); setSelectedProduct(''); setTransactions([]); return }
    fetch(`/api/inventory?category_id=${selectedCategory}`).then(r => r.json()).then(d => { if (d.success) setProducts(d.data) })
  }, [selectedCategory])

  useEffect(() => {
    if (!selectedProduct) { setTransactions([]); return }
    fetch(`/api/inventory/transfer-transactions?product_id=${selectedProduct}`).then(r => r.json()).then(d => { if (d.success) setTransactions(d.data) })
  }, [selectedProduct])

  const formatDate = (v?: string) => {
    if (!v) return '—'
    const d = new Date(v)
    if (isNaN(d.getTime())) return v.split(' ')[0] || '—'
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <PageHeader title="Transaction Data by Item" subtitle="View PS-wise transaction history by category and product" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedProduct('') }}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Product</option>
            {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name} (Avail: {p.available_stock})</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Ps Name</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Issued on</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t, i) => (
              <tr key={t.transaction_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{t.ps_name || '—'}</td>
                <td className="px-4 py-3">{t.stock}</td>
                <td className="px-4 py-3">{formatDate(t.added_on || t.created_on)}</td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Select category and product to view transactions</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
