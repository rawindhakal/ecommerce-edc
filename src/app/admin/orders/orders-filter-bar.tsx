'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, Calendar, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const DATE_PRESETS = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
]

const STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function OrdersFilterBar() {
  const router = useRouter()
  const sp = useSearchParams()
  const period = sp.get('period') || 'all'
  const status = sp.get('status') || 'all'
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const [search, setSearch] = useState(sp.get('q') || '')
  const [showCustom, setShowCustom] = useState(!!(from || to))

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString())
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === '' || v === 'all') params.delete(k)
      else params.set(k, v)
    })
    router.push(`/admin/orders?${params.toString()}`)
  }

  // Debounced live search
  useEffect(() => {
    const t = setTimeout(() => {
      const cur = sp.get('q') || ''
      if (search !== cur) update({ q: search || null })
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function setPreset(key: string) {
    if (key === 'custom') { setShowCustom(true); return }
    setShowCustom(false)
    update({ period: key === 'all' ? null : key, from: null, to: null })
  }

  return (
    <div className="admin-card p-4 space-y-3">
      {/* Row 1: search + status */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            type="search"
            placeholder="Search by order number, customer name or email…"
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={status}
          onChange={e => update({ status: e.target.value })}
          className="px-4 py-2.5 text-sm rounded-lg border border-border bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 capitalize min-w-[140px]"
        >
          {STATUSES.map(s => (
            <option key={s} value={s} className="capitalize">{s === 'all' ? 'All Statuses' : s}</option>
          ))}
        </select>
      </div>

      {/* Row 2: date presets */}
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        {DATE_PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              !showCustom && period === p.key
                ? 'rose-gold-gradient text-white border-0'
                : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setPreset('custom')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            showCustom ? 'rose-gold-gradient text-white border-0' : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          Custom Range
        </button>

        {showCustom && (
          <div className="flex items-center gap-2 ml-1">
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={e => update({ from: e.target.value, period: null })}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="text-muted-foreground text-xs">to</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={e => update({ to: e.target.value, period: null })}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {(from || to) && (
              <button
                onClick={() => { update({ from: null, to: null }); setShowCustom(false) }}
                className="text-muted-foreground hover:text-destructive cursor-pointer"
                aria-label="Clear date range"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
