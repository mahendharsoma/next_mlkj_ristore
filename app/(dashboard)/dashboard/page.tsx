'use client'
import { useEffect, useState } from 'react'
import { Users, Truck, Tags, Package, ClipboardList, FileCheck, Clock, Banknote, ArrowRight, Bell, AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'

interface LowStockItem { product_name: string; available_stock: number }
interface Stats {
  staff: number; vendors: number; categories: number; products: number;
  requisition: number; underCommittee: number; poPending: number; billsPending: number; fileTransfer: number;
  lowStock: LowStockItem[];
}

function StatCard({ label, value, icon: Icon, color, href }: { label: string; value: number; icon: React.ElementType; color: string; href?: string }) {
  const content = (
    <div className={`bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : <div>{content}</div>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [showBell, setShowBell] = useState(false)
  const [dismissBanner, setDismissBanner] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/stats').then(r => r.json()).then(d => { if (d.success) setStats(d.data) })
  }, [])

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  )

  const lowStockCount = stats.lowStock?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome to Stock Management System</p>
        </div>
        {lowStockCount > 0 && (
          <div className="relative">
            <button onClick={() => setShowBell(v => !v)}
              className="relative p-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {lowStockCount}
              </span>
            </button>
            {showBell && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-3">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Low Stock Alerts</p>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {stats.lowStock.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-2 py-1.5 bg-yellow-50 rounded-lg">
                      <span className="text-sm text-gray-700">{item.product_name}</span>
                      <span className="text-xs font-bold text-red-600">{item.available_stock} left</span>
                    </div>
                  ))}
                </div>
                <Link href="/inventory-stock" className="block mt-2 text-center text-xs text-blue-600 hover:underline">
                  View Inventory →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {lowStockCount > 0 && !dismissBanner && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800 flex-1">
            <strong>{lowStockCount} product{lowStockCount > 1 ? 's are' : ' is'} running low on stock.</strong>{' '}
            <Link href="/inventory-stock" className="underline">Check inventory</Link>
          </p>
          <button onClick={() => setDismissBanner(true)} className="text-yellow-600 hover:text-yellow-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Staff" value={stats.staff} icon={Users} color="bg-blue-500" href="/staff" />
        <StatCard label="Vendors" value={stats.vendors} icon={Truck} color="bg-green-500" href="/vendors" />
        <StatCard label="Categories" value={stats.categories} icon={Tags} color="bg-purple-500" href="/categories" />
        <StatCard label="Products" value={stats.products} icon={Package} color="bg-orange-500" href="/products" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Requisitions Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="New Requisitions" value={stats.requisition} icon={ClipboardList} color="bg-blue-400" href="/requisitions-by-status/Requisition" />
          <StatCard label="Under Committee" value={stats.underCommittee} icon={Clock} color="bg-yellow-500" href="/requisitions" />
          <StatCard label="PO Pending" value={stats.poPending} icon={FileCheck} color="bg-indigo-500" href="/requisitions" />
          <StatCard label="Bills Pending" value={stats.billsPending} icon={Banknote} color="bg-pink-500" href="/requisitions" />
          <StatCard label="File Transfer" value={stats.fileTransfer} icon={ArrowRight} color="bg-gray-500" href="/requisitions" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-3">Quick Links</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Add Indent', href: '/indents' }, { label: 'Add Requisition', href: '/requisitions' },
              { label: 'Purchase Orders', href: '/purchase-orders' }, { label: 'Inventory', href: '/inventory-stock' },
              { label: 'Wing Users', href: '/wing-users' }, { label: 'Condemnation', href: '/condemnation' },
              { label: 'PS Items', href: '/ps-items' }, { label: 'Total Inventory', href: '/total-inventory' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline px-3 py-2 rounded-lg hover:bg-blue-50 transition">
                → {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
