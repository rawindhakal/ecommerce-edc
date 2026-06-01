'use client'
import { useEffect } from 'react'

/**
 * Unregisters any rogue service workers and clears their caches.
 * A leftover SW from a previous project on localhost can intercept
 * requests and serve stale JS chunks, causing hydration mismatches.
 * This runs once on mount and is a no-op when nothing is registered.
 */
export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.getRegistrations?.().then(regs => {
      if (!regs.length) return
      regs.forEach(reg => reg.unregister())
      // Clear all caches the SW may have populated
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)))
      }
      // One hard reload to drop the stale chunks now that the SW is gone
      const KEY = 'glowlux_sw_cleared'
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1')
        window.location.reload()
      }
    }).catch(() => {})
  }, [])

  return null
}
