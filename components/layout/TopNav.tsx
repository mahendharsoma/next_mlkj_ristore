'use client'
import { signOut, useSession } from 'next-auth/react'
import { Menu, LogOut, User, Bell, AlertTriangle, PackageX, CheckCircle2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface LowStockItem { product_name: string; available_stock: number }

export default function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  const { data: session } = useSession()
  const [lowStock, setLowStock] = useState<LowStockItem[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/inventory/low-stock').then(r => r.json()).then(d => {
      if (d.success) setLowStock(d.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10 shadow-sm">
      <button onClick={onMenuClick} className="lg:hidden text-gray-500 hover:text-gray-700">
        <Menu className="w-6 h-6" />
      </button>
      <h1 className="text-base font-semibold text-gray-700 hidden lg:block">Stock Management System</h1>
      <div className="flex items-center gap-2">

        {/* Bell Notification */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setShowNotif(!showNotif)}
            className={`relative p-2 rounded-full transition ${showNotif ? 'bg-orange-50 text-orange-500' : 'hover:bg-gray-100 text-gray-500'}`}>
            <Bell className="w-5 h-5" />
            {lowStock.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5 animate-pulse">
                {lowStock.length}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white">Low Stock Alerts</span>
                </div>
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {lowStock.length} item{lowStock.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Body */}
              {lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600">All stock levels are fine</p>
                  <p className="text-xs text-gray-400 mt-1">No low stock alerts at this time</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {lowStock.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <PackageX className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{item.product_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-red-500 font-semibold">Stock: {item.available_stock}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${item.available_stock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            {item.available_stock === 0 ? 'Out of Stock' : 'Low'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50">
                <Link href="/inventory-stock" onClick={() => setShowNotif(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline">
                  View full inventory →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="hidden sm:block font-medium">{(session?.user as { name?: string })?.name || 'Profile'}</span>
        </Link>

        {/* Logout */}
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm transition">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  )
}
