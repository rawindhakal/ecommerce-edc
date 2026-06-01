'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Search, User, Heart, Menu, X, Sparkles, ChevronDown } from 'lucide-react'
import { useCart } from '@/lib/store/cart-context'
import { useAuth } from '@/lib/store/auth-context'
import { useStoreConfig } from '@/lib/store/store-config-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import CartDrawer from './cart-drawer'

const navLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Skincare', href: '/shop?category=skincare' },
  { label: 'Makeup', href: '/shop?category=makeup' },
  { label: 'Fragrance', href: '/shop?category=fragrance' },
  { label: 'Collections', href: '/shop?featured=true' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { itemCount, toggleCart } = useCart()
  const { profile } = useAuth()
  const { storeName } = useStoreConfig()
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isHome = pathname === '/'

  return (
    <>
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled || !isHome
          ? 'glass border-b border-white/40 shadow-sm'
          : 'bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rose-gold-gradient rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-display text-xl font-bold rose-gold-text tracking-wide">{storeName}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer',
                    'hover:bg-primary/10 hover:text-primary',
                    pathname === link.href ? 'text-primary font-semibold bg-primary/8' : 'text-foreground/80'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10 cursor-pointer"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10 cursor-pointer hidden md:flex"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Button>

              <Link href={profile ? '/account' : '/auth'}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-primary/10 cursor-pointer"
                  aria-label="Account"
                >
                  <User className="w-5 h-5" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-primary/10 relative cursor-pointer"
                onClick={toggleCart}
                aria-label={`Cart (${itemCount} items)`}
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] rose-gold-gradient border-0 text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full md:hidden hover:bg-primary/10 cursor-pointer"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {searchOpen && (
            <div className="pb-4 animate-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  type="search"
                  placeholder="Search for products, brands..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-full border border-border bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Mobile Menu */}
          {mobileOpen && (
            <div className="md:hidden py-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col gap-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-sm font-medium rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
      </header>

      <CartDrawer />
    </>
  )
}
