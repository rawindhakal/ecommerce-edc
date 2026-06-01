import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils'
import { ShoppingCart, TrendingUp, Clock, Package } from 'lucide-react'
import Link from 'next/link'
import OrdersFilterBar from './orders-filter-bar'
import OrderActions from './order-actions'

interface OrdersPageProps {
  searchParams: Promise<{ period?: string; status?: string; from?: string; to?: string; q?: string }>
}

function getDateRange(period?: string, from?: string, to?: string): { start?: string; end?: string } {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (from || to) {
    return {
      start: from ? `${from}T00:00:00` : undefined,
      end: to ? `${to}T23:59:59` : undefined,
    }
  }
  if (period === 'today') return { start: startOfToday.toISOString() }
  if (period === '7d') { const d = new Date(startOfToday); d.setDate(d.getDate() - 7); return { start: d.toISOString() } }
  if (period === '30d') { const d = new Date(startOfToday); d.setDate(d.getDate() - 30); return { start: d.toISOString() } }
  return {}
}

async function getOrders(params: { period?: string; status?: string; from?: string; to?: string; q?: string }) {
  const supabase = await createClient()
  let query = supabase
    .from('orders')
    .select('*, customer:profiles!customer_id(full_name, email, phone), items:order_items(id, product_name, quantity, unit_price, total)')
    .order('created_at', { ascending: false })
    .limit(200)

  const { start, end } = getDateRange(params.period, params.from, params.to)
  if (start) query = query.gte('created_at', start)
  if (end) query = query.lte('created_at', end)
  if (params.status && params.status !== 'all') query = query.eq('status', params.status)

  const { data } = await query
  let orders = data || []

  // Client-side text search (order number / customer)
  if (params.q) {
    const q = params.q.toLowerCase()
    orders = orders.filter((o: any) =>
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.customer?.full_name || '').toLowerCase().includes(q) ||
      (o.customer?.email || '').toLowerCase().includes(q)
    )
  }
  return orders
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams
  const orders = await getOrders(params)

  const revenue = orders.filter((o: any) => o.status === 'delivered').reduce((s: number, o: any) => s + o.total, 0)
  const stats = [
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending', value: orders.filter((o: any) => o.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Processing', value: orders.filter((o: any) => o.status === 'processing').length, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Revenue', value: formatPrice(revenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm">{orders.length} orders match your filters</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="admin-card p-4 flex items-center gap-3">
            <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-lg truncate">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Suspense>
        <OrdersFilterBar />
      </Suspense>

      <Card className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Order', 'Customer', 'Items', 'Total', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm font-semibold text-primary hover:underline">
                      {order.order_number}
                    </Link>
                    {order.is_pos_order && <Badge className="ml-2 text-[10px] bg-purple-50 text-purple-700 border border-purple-200">POS</Badge>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium">{order.customer?.full_name || 'Guest'}</p>
                    <p className="text-xs text-muted-foreground">{order.customer?.email || '—'}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{order.items?.length || 0}</td>
                  <td className="px-5 py-4 font-semibold">{formatPrice(order.total)}</td>
                  <td className="px-5 py-4">
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDateTime(order.created_at)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <OrderActions order={order} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold mb-1">No orders found</p>
              <p className="text-sm">Try adjusting your filters or date range</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export const dynamic = 'force-dynamic'
