'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { List } from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'

interface Item { product_id: number; product_name: string; category_name: string; category_id: number; total_stock: number; available_stock: number }
interface Category { category_id: number; category_name: string }

export default function InventoryStockPage() {
  const [items, setItems] = useState<Item[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')

  const load = (cat?: string) => {
    const url = cat ? `/api/inventory?category_id=${cat}` : '/api/inventory'
    fetch(url).then(r => r.json()).then(d => { if (d.success) setItems(d.data) })
  }

  useEffect(() => {
    load()
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setCats(d.data) })
  }, [])

  const filtered = items.filter(i =>
    i.product_name.toLowerCase().includes(search.toLowerCase()) ||
    i.category_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Inventory Stock" subtitle="Current stock levels for all products" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Total Stock</th>
              <th className="px-4 py-3 text-left">Available Stock</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item, i) => (
              <tr key={item.product_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{item.product_name}</td>
                <td className="px-4 py-3 text-gray-600">{item.category_name}</td>
                <td className="px-4 py-3 font-semibold">{item.total_stock}</td>
                <td className="px-4 py-3 font-semibold">{item.available_stock}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.available_stock <= 0 ? 'bg-red-100 text-red-700' : item.available_stock < 10 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                    {item.available_stock <= 0 ? 'Out of Stock' : item.available_stock < 10 ? 'Low Stock' : 'In Stock'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/item-by-transaction-data?category_id=${item.category_id}&product_id=${item.product_id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 bg-blue-50 rounded">
                    <List className="w-3 h-3" /> Transactions
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No items found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
