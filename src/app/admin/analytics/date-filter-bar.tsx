// FILE: src/app/admin/analytics/date-filter-bar.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Last Month', value: 'last_month' },
]

export default function DateFilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentPeriod = searchParams.get('period')
  const currentFrom = searchParams.get('from') || ''
  const currentTo = searchParams.get('to') || ''

  const [from, setFrom] = useState(currentFrom)
  const [to, setTo] = useState(currentTo)
  const isCustom = !currentPeriod && (currentFrom || currentTo)

  function navigatePeriod(period: string) {
    router.push(`/admin/analytics?period=${period}`)
  }

  function applyCustomRange() {
    if (!from && !to) return
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    router.push(`/admin/analytics?${params.toString()}`)
  }

  function clearFilters() {
    setFrom('')
    setTo('')
    router.push('/admin/analytics')
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 shrink-0">
          <CalendarDays className="w-4 h-4" />
          Filter by period
        </div>

        {/* Period buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => navigatePeriod(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer',
                currentPeriod === p.value
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50 hover:border-slate-300'
              )}
              style={
                currentPeriod === p.value
                  ? { backgroundColor: 'oklch(0.58 0.15 350)' }
                  : undefined
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Custom range */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Custom:</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={cn(
              'h-8 px-2.5 text-sm border rounded-lg outline-none transition-colors focus:ring-2',
              isCustom
                ? 'border-transparent text-white'
                : 'border-slate-200 bg-white text-slate-700 focus:border-slate-400'
            )}
            style={
              isCustom
                ? { backgroundColor: 'oklch(0.58 0.15 350)', '--tw-ring-color': 'oklch(0.58 0.15 350 / 0.3)' } as React.CSSProperties
                : { '--tw-ring-color': 'oklch(0.58 0.15 350 / 0.3)' } as React.CSSProperties
            }
          />
          <span className="text-slate-400 text-sm">to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={cn(
              'h-8 px-2.5 text-sm border rounded-lg outline-none transition-colors focus:ring-2',
              isCustom
                ? 'border-transparent text-white'
                : 'border-slate-200 bg-white text-slate-700 focus:border-slate-400'
            )}
            style={
              isCustom
                ? { backgroundColor: 'oklch(0.58 0.15 350)', '--tw-ring-color': 'oklch(0.58 0.15 350 / 0.3)' } as React.CSSProperties
                : { '--tw-ring-color': 'oklch(0.58 0.15 350 / 0.3)' } as React.CSSProperties
            }
          />
          <Button
            size="sm"
            onClick={applyCustomRange}
            disabled={!from && !to}
            className="h-8 text-xs border-0 text-white cursor-pointer"
            style={{ backgroundColor: 'oklch(0.58 0.15 350)' }}
          >
            Apply
          </Button>
          {(currentPeriod || currentFrom || currentTo) && (
            <button
              onClick={clearFilters}
              className="h-8 px-2.5 text-xs text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
