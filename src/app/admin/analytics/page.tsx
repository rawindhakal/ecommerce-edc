// FILE: src/app/admin/analytics/page.tsx

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { DollarSign, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import AnalyticsCharts from './analytics-charts'
import DateFilterBar from './date-filter-bar'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

function formatPrice(amount: number) {
  return 'Rs. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

function getDateRange(period?: string, from?: string, to?: string): { start: Date; end: Date } {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  if (period === 'today') {
    return { start: todayStart, end: todayEnd }
  }
  if (period === 'yesterday') {
    const y = new Date(todayStart)
    y.setDate(y.getDate() - 1)
    const yEnd = new Date(todayStart)
    yEnd.setMilliseconds(-1)
    return { start: y, end: yEnd }
  }
  if (period === 'week') {
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    return { start: weekStart, end: todayEnd }
  }
  if (period === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return { start: monthStart, end: todayEnd }
  }
  if (period === 'last_month') {
    const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
    return { start: lmStart, end: lmEnd }
  }
  if (from || to) {
    const start = from ? new Date(from) : new Date(2020, 0, 1)
    const end = to ? new Date(to + 'T23:59:59') : todayEnd
    return { start, end }
  }
  // Default: this month
  return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: todayEnd }
}

type SearchParamsProps = {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>
}

export default async function AnalyticsPage({ searchParams }: SearchParamsProps) {
  const params = await searchParams
  const { period, from, to } = params
  const { start, end } = getDateRange(period, from, to)

  const supabase = await createClient()

  const [ordersRes, orderItemsRes, customersRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, status, created_at, payment_method, split_payments')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at'),
    supabase
      .from('order_items')
      .select('product_name, quantity, total'),
    supabase
      .from('profiles')
      .select('loyalty_tier')
      .eq('role', 'customer'),
  ])

  const orders: Array<{
    id: string
    total: number
    status: string
    created_at: string
    payment_method: string
    split_payments: unknown
  }> = ordersRes.data || []
  const orderItems = orderItemsRes.data || []
  const customers = customersRes.data || []

  // KPI calculations
  const deliveredOrders = orders.filter((o) => o.status === 'delivered')
  const totalRevenue = deliveredOrders.reduce((s, o) => s + o.total, 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? orders.reduce((s, o) => s + o.total, 0) / totalOrders : 0
  const totalCustomers = customers.length

  // Daily sales trend
  const dailyMap: Record<string, { revenue: number; orders: number }> = {}
  orders.forEach((o) => {
    const day = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!dailyMap[day]) dailyMap[day] = { revenue: 0, orders: 0 }
    if (o.status === 'delivered') dailyMap[day].revenue += o.total
    dailyMap[day].orders += 1
  })
  const dailySales = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }))

  // Monthly revenue (all time for trend reference)
  const monthlyRevenue: Record<string, number> = {}
  orders.filter((o) => o.status === 'delivered').forEach((o) => {
    const month = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + o.total
  })

  // Top products
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  orderItems.forEach((item: any) => {
    if (!item.product_name) return
    if (!productMap[item.product_name]) productMap[item.product_name] = { name: item.product_name, qty: 0, revenue: 0 }
    productMap[item.product_name].qty += item.quantity || 0
    productMap[item.product_name].revenue += item.total || 0
  })
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  // Order status distribution
  const statusMap: Record<string, number> = {}
  orders.forEach((o) => { statusMap[o.status] = (statusMap[o.status] || 0) + 1 })

  // Tier distribution (all customers, not filtered by date)
  const tierMap: Record<string, number> = {}
  customers.forEach((c: any) => { tierMap[c.loyalty_tier] = (tierMap[c.loyalty_tier] || 0) + 1 })

  // Payment methods
  const paymentMap: Record<string, number> = {}
  orders.forEach((o) => {
    // Check split_payments first
    const splits = o.split_payments as Array<{ method: string; amount: number }> | null
    if (splits && Array.isArray(splits) && splits.length > 0) {
      splits.forEach((s) => {
        const method = s.method || 'unknown'
        paymentMap[method] = (paymentMap[method] || 0) + 1
      })
    } else if (o.payment_method) {
      paymentMap[o.payment_method] = (paymentMap[o.payment_method] || 0) + 1
    }
  })

  const periodLabel = period
    ? PERIOD_LABELS[period] || period
    : from || to
    ? `${from || '…'} → ${to || '…'}`
    : 'This Month'

  const chartData = {
    monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })),
    topProducts,
    statusData: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    tierData: Object.entries(tierMap).map(([tier, count]) => ({ tier, count })),
    paymentData: Object.entries(paymentMap).map(([method, count]) => ({ method, count })),
    dailySales,
  }

  const kpis = [
    {
      label: 'Total Revenue',
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      sub: 'From delivered orders',
      trend: null,
    },
    {
      label: 'Total Orders',
      value: totalOrders.toLocaleString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: `${deliveredOrders.length} delivered`,
      trend: null,
    },
    {
      label: 'Avg Order Value',
      value: formatPrice(avgOrderValue),
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      sub: 'Per order',
      trend: null,
    },
    {
      label: 'Total Customers',
      value: totalCustomers.toLocaleString(),
      icon: Users,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      sub: 'Active members',
      trend: null,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Business performance — <span className="font-medium text-slate-700">{periodLabel}</span>
          </p>
        </div>
      </div>

      {/* Date Filter */}
      <Suspense fallback={<div className="h-16 bg-white border border-slate-200 rounded-xl shadow-sm animate-pulse" />}>
        <DateFilterBar />
      </Suspense>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900 leading-tight">{kpi.value}</p>
            <p className="text-xs font-medium text-slate-600 mt-1">{kpi.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <AnalyticsCharts data={chartData} />
    </div>
  )
}

const PERIOD_LABELS: Record<string, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This Week',
  month: 'This Month',
  last_month: 'Last Month',
}
