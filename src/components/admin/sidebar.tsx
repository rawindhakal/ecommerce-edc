'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Warehouse,
  CreditCard, Trophy, BarChart3, Settings, Sparkles, LogOut, Store, Tag, FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/store/auth-context'
import { useStoreConfig } from '@/lib/store/store-config-context'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: Warehouse, label: 'Inventory', href: '/admin/inventory' },
  { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: CreditCard, label: 'POS System', href: '/admin/pos' },
  { icon: Trophy, label: 'Loyalty', href: '/admin/loyalty' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: FileText, label: 'Reports', href: '/admin/reports' },
  { icon: Tag, label: 'Coupons', href: '/admin/coupons' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

/**
 * Sidebar panel content. Fills its parent (h-full).
 * The parent decides whether it's a fixed desktop column or a mobile drawer.
 */
export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const rawPathname = usePathname()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const pathname = mounted ? rawPathname : ''
  const { profile } = useAuth()
  const { storeName } = useStoreConfig()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border shrink-0">
        <div className="w-8 h-8 rose-gold-gradient rounded-lg flex items-center justify-center shrink-0 shadow-md">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="overflow-hidden">
          <p className="font-display font-bold text-black text-lg leading-none truncate">{storeName}</p>
          <p className="text-sidebar-foreground/50 text-[10px] mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-hide">
        <div className="space-y-1">
          {navItems.map(item => {
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-sidebar-border p-2 space-y-1 shrink-0">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all cursor-pointer"
        >
          <Store className="w-5 h-5 shrink-0" /> View Store
        </Link>

        {profile && (
          <div className="px-3 py-2 rounded-xl bg-sidebar-accent/50">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{profile.full_name || profile.email}</p>
            <p className="text-[10px] text-sidebar-foreground/50 capitalize">{profile.role}</p>
          </div>
        )}

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-red-400 transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0" /> Sign Out
        </button>
      </div>
    </div>
  )
}
