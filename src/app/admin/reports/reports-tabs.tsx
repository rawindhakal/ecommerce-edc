'use client'
import { useState, type ReactNode } from 'react'
import { FileText, CreditCard, ClipboardList } from 'lucide-react'

const TABS = [
  { key: 'sales',    label: 'Sales Report',   icon: FileText },
  { key: 'payments', label: 'Payment Report',  icon: CreditCard },
  { key: 'dayend',   label: 'Day End Report',  icon: ClipboardList },
]

interface Props {
  salesTab: ReactNode
  paymentsTab: ReactNode
  dayEndTab: ReactNode
}

export default function ReportsTabs({ salesTab, paymentsTab, dayEndTab }: Props) {
  const [active, setActive] = useState('sales')

  const content: Record<string, ReactNode> = {
    sales: salesTab,
    payments: paymentsTab,
    dayend: dayEndTab,
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-white border border-border rounded-xl p-1 w-fit shadow-sm">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              active === tab.key
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>{content[active]}</div>
    </div>
  )
}
