'use client'
import { useStoreConfig } from '@/lib/store/store-config-context'

/** Renders the dynamic business name (from store_settings, default Empress Dreams Cosmetics). */
export default function BrandName({ className }: { className?: string }) {
  const { storeName } = useStoreConfig()
  return <span className={className}>{storeName}</span>
}
