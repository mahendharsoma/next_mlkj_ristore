'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, ShieldCheck, Tags, Package, Truck,
  Building2, ShoppingCart, Warehouse, ClipboardList,
  FileText, ArrowRightLeft, Flame, BarChart3,
  ChevronDown, ChevronRight, Package2, X, MapPin,
  type LucideIcon,
} from 'lucide-react'

type NavItem = {
  label: string
  href?: string
  icon: LucideIcon
  children?: Array<{ label: string; href: string }>
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Staff', href: '/staff', icon: Users },
  // { label: 'Roles', href: '/roles', icon: ShieldCheck },
  { label: 'Categories', href: '/categories', icon: Tags },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Vendors', href: '/vendors', icon: Truck },
  { label: 'PS / Department', href: '/ps', icon: Building2 },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
  { label: 'Chief Office Items', href: '/chief-office-items', icon: Warehouse },
  { label: 'Inventory Stock', href: '/inventory-stock', icon: Package2 },
  {
    label: 'Requisitions', icon: ClipboardList,
    children: [
      { label: 'All Requisitions', href: '/requisitions' },
      { label: 'Rejected', href: '/rejected-requisitions' },
    ],
  },
  { label: 'Indents', href: '/indents', icon: FileText },
  { label: 'PS Items', href: '/ps-items', icon: MapPin },
  { label: 'Items Transfer', href: '/items-added-data', icon: ArrowRightLeft },
  {
    label: 'Condemnation', icon: Flame,
    children: [
      { label: 'Condemn Stock', href: '/condemnation' },
      { label: 'Condemnation List', href: '/condemnation-list' },
    ],
  },
  {
    label: 'Reports', icon: BarChart3,
    children: [
      { label: 'Item Transactions', href: '/item-transactions' },
      { label: 'PS Item Transactions', href: '/ps-item-transactions' },
      { label: 'Total Inventory', href: '/total-inventory' },
    ],
  },
]

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState<string[]>(['Requisitions'])

  function toggle(label: string) {
    setExpanded(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-800 text-slate-300 z-30 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Package className="w-7 h-7 text-blue-400" />
            <span className="font-bold text-white text-lg">Stock Management</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map(item => {
            if (item.children) {
              const isOpen = expanded.includes(item.label)
              const anyChildActive = item.children.some(child => isActive(child.href))
              return (
                <div key={item.label}>
                  <button onClick={() => toggle(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition
                      ${anyChildActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}>
                    <span className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />{item.label}
                    </span>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {isOpen && (
                    <div className="ml-7 border-l border-slate-600 pl-3 mb-1">
                      {item.children.map(child => (
                        <Link key={child.href} href={child.href}
                          className={`block px-3 py-2 rounded-lg text-sm mb-0.5 transition
                            ${isActive(child.href) ? 'bg-blue-500 text-white' : 'hover:bg-slate-700 text-slate-400'}`}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            if (!item.href) return null

            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition
                  ${isActive(item.href) ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}>
                <item.icon className="w-4 h-4" />{item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
