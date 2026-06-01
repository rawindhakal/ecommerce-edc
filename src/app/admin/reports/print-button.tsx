// FILE: src/app/admin/reports/print-button.tsx
'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <Printer className="w-4 h-4" />
      Print
    </button>
  )
}
