'use client'
import { Search } from 'lucide-react'

export default function CustomerSearchInput() {
  return (
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="search"
        placeholder="Search by name, phone, code…"
        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        onChange={e => {
          const q = e.target.value.toLowerCase()
          document.querySelectorAll('[data-customer-row]').forEach(row => {
            const text = (row as HTMLElement).dataset.search || ''
            ;(row as HTMLElement).style.display = text.includes(q) ? '' : 'none'
          })
        }}
      />
    </div>
  )
}
