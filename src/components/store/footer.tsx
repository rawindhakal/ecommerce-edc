import Link from 'next/link'
import { Sparkles, Globe, Share2, MessageCircle, Music } from 'lucide-react'
import BrandName from '@/components/brand-name'

const links = {
  Shop: [
    { label: 'All Products', href: '/shop' },
    { label: 'Skincare', href: '/shop?category=skincare' },
    { label: 'Makeup', href: '/shop?category=makeup' },
    { label: 'Fragrance', href: '/shop?category=fragrance' },
    { label: 'New Arrivals', href: '/shop?sort=newest' },
  ],
  Account: [
    { label: 'My Account', href: '/account' },
    { label: 'My Orders', href: '/account?tab=orders' },
    { label: 'Loyalty Rewards', href: '/account?tab=loyalty' },
    { label: 'Wishlist', href: '/account?tab=wishlist' },
  ],
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Press', href: '/press' },
    { label: 'Careers', href: '/careers' },
  ],
  Help: [
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Shipping & Returns', href: '/shipping' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
}

const socials = [
  { icon: Globe, href: '#', label: 'Instagram' },
  { icon: Share2, href: '#', label: 'Facebook' },
  { icon: MessageCircle, href: '#', label: 'Twitter / X' },
  { icon: Music, href: '#', label: 'TikTok' },
]

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80 mt-auto">
      {/* Top Banner */}
      <div className="rose-gold-gradient py-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 text-white text-sm font-medium">
          <span>✦ Free shipping on orders over $75</span>
          <span>✦ Earn points with every purchase</span>
          <span>✦ Clean, cruelty-free formulas</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rose-gold-gradient rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <BrandName className="font-display text-xl font-bold text-white" />
            </Link>
            <p className="text-sm text-background/60 leading-relaxed mb-4">
              Luxury cosmetics for the modern woman. Premium formulas, sustainably sourced.
            </p>
            <div className="flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-full border border-background/20 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-display font-semibold text-white mb-4 text-sm">{category}</h4>
              <ul className="space-y-2">
                {items.map(item => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-background/60 hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-background/10 pt-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="font-display font-semibold text-white">Join the Glow Club</h4>
              <p className="text-sm text-background/60">Get 15% off your first order + exclusive offers</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 md:w-64 px-4 py-2 rounded-full bg-background/10 border border-background/20 text-white placeholder:text-background/40 text-sm focus:outline-none focus:border-primary"
              />
              <button className="px-5 py-2 rose-gold-gradient text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-background/40">
          <p>© {new Date().getFullYear()} <BrandName />. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
