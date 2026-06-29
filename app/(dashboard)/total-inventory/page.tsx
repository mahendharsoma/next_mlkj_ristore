'use client'
import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'

interface Category { category_id: number; category_name: string }
interface Product { product_id: number; product_name: string; category_name: string; total_stock: number; available_stock: number }

export default function TotalInventoryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setCategories(d.data) })
    load()
  }, [])

  useEffect(() => {
    load()
  }, [selectedCategory])

  const load = () => {
    const url = selectedCategory ? `/api/inventory?category_id=${selectedCategory}` : '/api/inventory'
    fetch(url).then(r => r.json()).then(d => { if (d.success) setProducts(d.data) })
  }

  const totalStock = products.reduce((sum, p) => sum + Number(p.total_stock || 0), 0)
  const totalAvailable = products.reduce((sum, p) => sum + Number(p.available_stock || 0), 0)

  return (
    <div>
      <PageHeader title="Total Product Wise Inventory" subtitle="View total and available stock for all products" />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
          className="w-full md:w-1/3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
        </select>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Total Stock:</span> {totalStock} &nbsp;|&nbsp;
          <span className="font-medium">Available Stock:</span> {totalAvailable}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Total Stock</th>
              <th className="px-4 py-3 text-left">Available Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p, i) => (
              <tr key={p.product_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3">{p.category_name || '—'}</td>
                <td className="px-4 py-3 font-medium">{p.product_name}</td>
                <td className="px-4 py-3">{p.total_stock}</td>
                <td className="px-4 py-3">{p.available_stock}</td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No inventory records found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
