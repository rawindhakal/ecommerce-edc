import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/lib/store/cart-context'
import { AuthProvider } from '@/lib/store/auth-context'
import { StoreConfigProvider } from '@/lib/store/store-config-context'
import { Toaster } from '@/components/ui/sonner'
import ServiceWorkerCleanup from '@/components/sw-cleanup'
import { DEFAULT_STORE_NAME, DEFAULT_STORE_TAGLINE } from '@/lib/store-config'

export const metadata: Metadata = {
  title: { default: `${DEFAULT_STORE_NAME} — ${DEFAULT_STORE_TAGLINE}`, template: `%s | ${DEFAULT_STORE_NAME}` },
  description: 'Discover luxury cosmetics and skincare. Premium beauty products curated for the modern woman.',
  keywords: ['cosmetics', 'skincare', 'beauty', 'luxury', 'makeup', 'fragrance'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <ServiceWorkerCleanup />
        <StoreConfigProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster position="top-right" richColors />
            </CartProvider>
          </AuthProvider>
        </StoreConfigProvider>
      </body>
    </html>
  )
}
