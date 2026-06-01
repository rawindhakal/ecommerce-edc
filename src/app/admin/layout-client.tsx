'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, Sparkles } from 'lucide-react'
import AdminSidebar from '@/components/admin/sidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/sonner'
import { useStoreConfig } from '@/lib/store/store-config-context'

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { storeName } = useStoreConfig()
  const isLoginPage = pathname === '/admin/login'

  if (isLoginPage) {
    return (
      <>
        {children}
        <Toaster position="top-right" richColors />
      </>
    )
  }

  return (
    <div className="flex h-dvh bg-muted/30 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-sidebar-border">
        <AdminSidebar />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="p-0 w-72 border-0 [&>button]:text-white">
          <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 h-14 px-4 bg-sidebar text-white shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/10 cursor-pointer text-black"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rose-gold-gradient rounded-lg flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-base text-black truncate">{storeName}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}
