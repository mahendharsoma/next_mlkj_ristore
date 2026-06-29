'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import PageHeader from '@/components/ui/PageHeader'
import { formatDisplayDate } from '@/lib/helpers'

interface Category { category_id: number; category_name: string }
interface Product { product_id: number; product_name: string; category_id: number; category_name: string }
interface Transaction { transaction_id: number; item_id: number; product_id: number; stock: number; added_on: string; price: number; type_of_transaction: string; created_by_name: string; created_on: string }

function ItemByTransactionData() {
  const searchParams = useSearchParams()
  const categoryId = searchParams.get('category_id') || ''
  const productId = searchParams.get('product_id') || ''

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) setCategories(d.data) })
    fetch('/api/products').then(r => r.json()).then(d => { if (d.success) setProducts(d.data) })
  }, [])

  useEffect(() => {
    if (!productId) return
    fetch(`/api/inventory/transactions?product_id=${productId}`)
      .then(async r => {
        const text = await r.text()
        const d = text ? JSON.parse(text) : { success: false }
        if (d.success) setTransactions(d.data)
        else if (d.message) toast.error(d.message)
      })
      .catch(() => toast.error('Failed to load transactions'))
  }, [productId])

  const filteredProducts = products.filter(p => String(p.category_id) === categoryId)
  const selectedProduct = products.find(p => String(p.product_id) === productId)

  return (
    <div>
      <PageHeader title="Item Transaction Data" subtitle="View transaction history by product" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex gap-3">
          <select value={categoryId} onChange={e => { const cat = e.target.value; window.location.href = `/item-by-transaction-data?category_id=${cat}` }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
          <select value={productId} onChange={e => { const prod = e.target.value; window.location.href = `/item-by-transaction-data?category_id=${categoryId}&product_id=${prod}` }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Product</option>
            {filteredProducts.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
          </select>
        </div>
      </div>

      {selectedProduct && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Transactions — {selectedProduct.product_name}</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Stock</th>
                {/* <th className="px-4 py-3 text-left">Price</th> */}
                <th className="px-4 py-3 text-left">Added On</th>
                <th className="px-4 py-3 text-left">Type</th>
                {/* <th className="px-4 py-3 text-left">Created By</th> */}
                <th className="px-4 py-3 text-left">Created On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t, i) => (
                <tr key={t.transaction_id}>
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3">{t.stock}</td>
                  {/* <td className="px-4 py-3">{t.price}</td> */}
                  <td className="px-4 py-3">{t.added_on}</td>
                  <td className="px-4 py-3">{t.type_of_transaction}</td>
                  {/* <td className="px-4 py-3">{t.created_by_name}</td> */}
                  <td className="px-4 py-3">{formatDisplayDate(t.created_on, true)}</td>
                </tr>
              ))}
              {transactions.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No transactions found</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function ItemByTransactionDataPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <ItemByTransactionData />
    </Suspense>
  )
}
