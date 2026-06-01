import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, CreditCard, ClipboardList, AlertCircle } from 'lucide-react'
import DayEndReport from './day-end-report'
import PrintButton from './print-button'
import ReportsTabs from './reports-tabs'

export const dynamic = 'force-dynamic'

function formatPrice(amount: number) {
  return 'Rs. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

function formatDateTime(d: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed:  'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border-purple-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
  refunded:   'bg-slate-50 text-slate-600 border-slate-200',
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', esewa: 'eSewa', fonepay: 'FonePay',
  card: 'Card', bank_transfer: 'Bank Transfer', online: 'Online',
}

async function getReportData() {
  const supabase = await createClient()

  // Fetch orders — select only columns that definitely exist
  const { data: ordersRaw, error: ordersErr } = await supabase
    .from('orders')
    .select(`
      id, order_number, total, status, created_at,
      payment_method, tax_amount, discount_amount, subtotal,
      customer:profiles!customer_id(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  if (ordersErr) {
    console.error('[reports] orders query error:', ordersErr.message)
  }

  // Fetch split_payments separately — graceful if column missing
  const { data: splitRaw } = await supabase
    .from('orders')
    .select('id, split_payments')
    .order('created_at', { ascending: false })
    .limit(500)

  // Build a map of split_payments by order id
  const splitMap: Record<string, Array<{ method: string; amount: number; reference?: string }>> = {}
  if (splitRaw) {
    splitRaw.forEach((row: any) => {
      if (Array.isArray(row.split_payments) && row.split_payments.length > 0) {
        splitMap[row.id] = row.split_payments
      }
    })
  }

  // Fetch order items
  const { data: itemsRaw, error: itemsErr } = await supabase
    .from('order_items')
    .select('order_id, product_name, quantity, total, unit_price')

  if (itemsErr) console.error('[reports] items query error:', itemsErr.message)

  const orders = (ordersRaw || []) as any[]
  const items = (itemsRaw || []) as any[]

  return { orders, items, splitMap, hasError: !!(ordersErr) }
}

export default async function ReportsPage() {
  const { orders, items, splitMap, hasError } = await getReportData()

  // Map order_id → items
  const itemsByOrder: Record<string, typeof items> = {}
  items.forEach((item: any) => {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = []
    itemsByOrder[item.order_id].push(item)
  })

  // Sales totals — use stored columns if available, fall back to calculation
  const salesTotals = orders.reduce(
    (acc, o: any) => {
      acc.total    += o.total || 0
      acc.tax      += o.tax_amount || 0
      acc.discount += o.discount_amount || 0
      acc.subtotal += o.subtotal || (o.total - (o.tax_amount || 0) + (o.discount_amount || 0))
      return acc
    },
    { subtotal: 0, tax: 0, discount: 0, total: 0 }
  )

  // Payment groups
  const paymentGroups: Record<string, {
    count: number; total: number
    transactions: Array<{ orderId: string; orderNumber: string; ref: string; amount: number; date: string }>
  }> = {}

  orders.forEach((o: any) => {
    const splits = splitMap[o.id]
    if (splits && splits.length > 0) {
      splits.forEach((s: any) => {
        const key = s.method || 'unknown'
        if (!paymentGroups[key]) paymentGroups[key] = { count: 0, total: 0, transactions: [] }
        paymentGroups[key].count += 1
        paymentGroups[key].total += s.amount || 0
        paymentGroups[key].transactions.push({
          orderId: o.id,
          orderNumber: o.order_number,
          ref: s.reference || '—',
          amount: s.amount || 0,
          date: o.created_at,
        })
      })
    } else {
      const key = o.payment_method || 'unknown'
      if (!paymentGroups[key]) paymentGroups[key] = { count: 0, total: 0, transactions: [] }
      paymentGroups[key].count += 1
      paymentGroups[key].total += o.total || 0
      paymentGroups[key].transactions.push({
        orderId: o.id,
        orderNumber: o.order_number,
        ref: '—',
        amount: o.total || 0,
        date: o.created_at,
      })
    }
  })

  const salesTab = (
    <Card className="admin-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-display font-semibold text-lg">Sales Report</h2>
          <p className="text-xs text-muted-foreground">{orders.length} orders total</p>
        </div>
        <PrintButton />
      </div>

      {hasError && (
        <div className="mx-6 my-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Could not load some order data. Make sure you have run the database patches.
        </div>
      )}

      <div className="overflow-x-auto" id="sales-report-table">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              {['Order #', 'Date', 'Customer', 'Items', 'Subtotal', 'VAT', 'Discount', 'Total', 'Payment', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o: any) => {
              const orderItems = itemsByOrder[o.id] || []
              const subtotal = o.subtotal || (o.total - (o.tax_amount || 0) + (o.discount_amount || 0))
              const tax = o.tax_amount || 0
              const discount = o.discount_amount || 0
              return (
                <tr key={o.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-xs">{o.order_number}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{(o.customer as any)?.full_name || 'Guest'}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{(o.customer as any)?.email || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {orderItems.length === 0
                      ? <span className="text-muted-foreground/50">—</span>
                      : <>
                          {orderItems.slice(0, 2).map((i: any, idx: number) => (
                            <div key={idx}>{i.product_name} ×{i.quantity}</div>
                          ))}
                          {orderItems.length > 2 && <div className="text-muted-foreground/60">+{orderItems.length - 2} more</div>}
                        </>
                    }
                  </td>
                  <td className="px-4 py-3 tabular-nums text-sm">{formatPrice(subtotal)}</td>
                  <td className="px-4 py-3 tabular-nums text-sm text-muted-foreground">{tax > 0 ? formatPrice(tax) : '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-sm text-red-500">{discount > 0 ? `-${formatPrice(discount)}` : '—'}</td>
                  <td className="px-4 py-3 tabular-nums font-bold text-sm">{formatPrice(o.total)}</td>
                  <td className="px-4 py-3 text-xs capitalize">
                    {METHOD_LABELS[o.payment_method] || o.payment_method || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`${STATUS_COLORS[o.status] || STATUS_COLORS.pending} border text-xs`}>
                      {o.status}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-foreground text-background">
              <td colSpan={4} className="px-4 py-3 font-semibold text-sm">TOTALS ({orders.length} orders)</td>
              <td className="px-4 py-3 font-bold tabular-nums text-sm">{formatPrice(salesTotals.subtotal)}</td>
              <td className="px-4 py-3 font-bold tabular-nums text-sm">{salesTotals.tax > 0 ? formatPrice(salesTotals.tax) : '—'}</td>
              <td className="px-4 py-3 font-bold tabular-nums text-sm text-red-300">
                {salesTotals.discount > 0 ? `-${formatPrice(salesTotals.discount)}` : '—'}
              </td>
              <td className="px-4 py-3 font-bold tabular-nums text-sm">{formatPrice(salesTotals.total)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
        {orders.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold mb-1">No orders found</p>
            <p className="text-sm">Orders will appear here once transactions are made</p>
          </div>
        )}
      </div>
    </Card>
  )

  const paymentsTab = (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {(['cash', 'esewa', 'fonepay', 'card', 'bank_transfer'] as const).map(method => {
          const g = paymentGroups[method]
          return (
            <Card key={method} className="admin-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{METHOD_LABELS[method]}</p>
              <p className="font-display text-xl font-bold tabular-nums">{g ? formatPrice(g.total) : 'Rs. 0.00'}</p>
              <p className="text-xs text-muted-foreground mt-1">{g?.count || 0} transactions</p>
            </Card>
          )
        })}
      </div>

      {/* Transaction tables per method */}
      {Object.entries(paymentGroups).length === 0 ? (
        <Card className="admin-card p-16 text-center">
          <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold mb-1">No payment transactions</p>
          <p className="text-sm text-muted-foreground">Transactions will appear here after orders are placed</p>
        </Card>
      ) : (
        Object.entries(paymentGroups).map(([method, group]) => (
          <Card key={method} className="admin-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-semibold">{METHOD_LABELS[method] || method}</h3>
                <p className="text-xs text-muted-foreground">{group.count} transactions · {formatPrice(group.total)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {['Order #', 'Reference / Txn ID', 'Amount', 'Date'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {group.transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-xs">{tx.orderNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.ref}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums">{formatPrice(tx.amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDateTime(tx.date)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 border-t border-border">
                    <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Total</td>
                    <td className="px-4 py-2.5 font-bold tabular-nums">{formatPrice(group.total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        ))
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Sales, payment, and day-end reports</p>
      </div>

      <ReportsTabs
        salesTab={salesTab}
        paymentsTab={paymentsTab}
        dayEndTab={<DayEndReport />}
      />
    </div>
  )
}
