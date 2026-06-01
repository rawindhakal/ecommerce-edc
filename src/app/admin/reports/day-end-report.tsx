// FILE: src/app/admin/reports/day-end-report.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Printer, CheckCircle, TrendingUp, ShoppingCart, Banknote, Smartphone, Package } from 'lucide-react'
import { getBrandName } from '@/lib/store-config'

const VAT_RATE = 0.13

function formatPrice(amount: number) {
  return 'Rs. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

function toDateString(d: Date) {
  return d.toISOString().split('T')[0]
}

interface DayData {
  orders: any[]
  items: any[]
  totalSales: number
  totalOrders: number
  cashCollected: number
  digitalTotal: number
  vatCollected: number
  productSummary: Array<{ name: string; qty: number; revenue: number }>
}

export default function DayEndReport() {
  const supabase = createClient()
  const [selectedDate, setSelectedDate] = useState(toDateString(new Date()))
  const [data, setData] = useState<DayData | null>(null)
  const [loading, setLoading] = useState(false)
  const [closing, setClosing] = useState(false)

  const fetchData = useCallback(async (date: string) => {
    setLoading(true)
    try {
      const start = `${date}T00:00:00`
      const end = `${date}T23:59:59`

      const [ordersRes, itemsRes, splitsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, total, status, payment_method, created_at, discount_amount, tax_amount')
          .gte('created_at', start)
          .lte('created_at', end)
          .order('created_at'),
        supabase
          .from('order_items')
          .select('order_id, product_name, quantity, total, unit_price')
          .gte('created_at', start)
          .lte('created_at', end),
        // split_payments queried separately — graceful if column missing
        supabase
          .from('orders')
          .select('id, split_payments')
          .gte('created_at', start)
          .lte('created_at', end),
      ])

      const orders = ordersRes.data || []
      const items = itemsRes.data || []

      // Build split_payments map
      const splitMap: Record<string, Array<{ method: string; amount: number }>> = {}
      if (splitsRes.data) {
        splitsRes.data.forEach((row: any) => {
          if (Array.isArray(row.split_payments) && row.split_payments.length > 0) {
            splitMap[row.id] = row.split_payments
          }
        })
      }

      // Totals — include all non-cancelled orders
      const activeOrders = orders.filter((o: any) => o.status !== 'cancelled' && o.status !== 'refunded')
      const totalSales = activeOrders.reduce((s: number, o: any) => s + (o.total || 0), 0)
      const totalOrders = orders.length

      // Payment breakdown
      let cashCollected = 0
      let digitalTotal = 0

      orders.forEach((o: any) => {
        const splits = splitMap[o.id]
        if (splits && splits.length > 0) {
          splits.forEach((s: any) => {
            if (s.method === 'cash') cashCollected += s.amount || 0
            else digitalTotal += s.amount || 0
          })
        } else if (o.payment_method === 'cash') {
          cashCollected += o.total || 0
        } else {
          digitalTotal += o.total || 0
        }
      })

      // VAT
      const vatCollected = totalSales * VAT_RATE / (1 + VAT_RATE)

      // Product summary
      const productMap: Record<string, { name: string; qty: number; revenue: number }> = {}
      items.forEach((i: any) => {
        if (!i.product_name) return
        if (!productMap[i.product_name]) productMap[i.product_name] = { name: i.product_name, qty: 0, revenue: 0 }
        productMap[i.product_name].qty += i.quantity || 0
        productMap[i.product_name].revenue += i.total || 0
      })
      const productSummary = Object.values(productMap).sort((a, b) => b.revenue - a.revenue)

      setData({ orders, items, totalSales, totalOrders, cashCollected, digitalTotal, vatCollected, productSummary })
    } catch (err: any) {
      toast.error('Failed to load day report: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData(selectedDate)
  }, [selectedDate, fetchData])

  function handlePrint() {
    if (!data) return

    const storeDate = new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Day End Report – ${selectedDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 80mm; max-width: 80mm; padding: 8px; color: #000; }
    h1 { text-align: center; font-size: 15px; font-weight: bold; margin-bottom: 2px; }
    .sub { text-align: center; font-size: 11px; margin-bottom: 6px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .bold { font-weight: bold; }
    .center { text-align: center; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { text-align: left; font-weight: bold; border-bottom: 1px solid #000; padding: 2px 0; }
    td { padding: 2px 0; }
    .amount { text-align: right; }
    .total-row { font-weight: bold; border-top: 1px solid #000; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${getBrandName()}</h1>
  <div class="sub">Day End Report</div>
  <div class="sub">${storeDate}</div>
  <div class="divider"></div>

  <div class="row"><span>Total Orders:</span><span class="bold">${data.totalOrders}</span></div>
  <div class="row"><span>Total Sales:</span><span class="bold">Rs. ${data.totalSales.toFixed(2)}</span></div>
  <div class="row"><span>VAT Collected (13%):</span><span>Rs. ${data.vatCollected.toFixed(2)}</span></div>

  <div class="divider"></div>
  <div class="row bold"><span>Cash Collected:</span><span>Rs. ${data.cashCollected.toFixed(2)}</span></div>
  <div class="row bold"><span>Digital Payments:</span><span>Rs. ${data.digitalTotal.toFixed(2)}</span></div>

  <div class="divider"></div>
  <div class="bold center">Product-wise Sales</div>
  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th style="text-align:center">Qty</th>
        <th class="amount">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${data.productSummary.map((p) => `
      <tr>
        <td>${p.name.slice(0, 20)}${p.name.length > 20 ? '…' : ''}</td>
        <td style="text-align:center">${p.qty}</td>
        <td class="amount">Rs. ${p.revenue.toFixed(2)}</td>
      </tr>`).join('')}
      <tr class="total-row">
        <td colspan="2">TOTAL</td>
        <td class="amount">Rs. ${data.totalSales.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="divider"></div>
  <div class="center" style="font-size:10px">Printed: ${new Date().toLocaleString('en-US')}</div>
  <div class="center bold" style="margin-top:8px">— End of Day Report —</div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=350,height=600')
    if (!win) { toast.error('Popup blocked. Allow popups to print.'); return }
    win.document.write(html)
    win.document.close()
    win.onload = () => { win.print(); win.close() }
  }

  async function handleCloseDay() {
    if (!data) return
    if (!confirm(`Close day for ${selectedDate}? This action is for record-keeping only.`)) return
    setClosing(true)
    try {
      // Log to day_closings table if it exists, otherwise just show success
      const { error } = await supabase.from('day_closings').insert({
        date: selectedDate,
        total_orders: data.totalOrders,
        total_sales: data.totalSales,
        cash_collected: data.cashCollected,
        digital_total: data.digitalTotal,
        vat_collected: data.vatCollected,
        closed_at: new Date().toISOString(),
      })
      if (error && error.code !== '42P01') throw error
      toast.success(`Day ${selectedDate} closed successfully!`)
    } catch (err: any) {
      // If table doesn't exist, still show success UI
      if (err?.code === '42P01') {
        toast.success(`Day report for ${selectedDate} recorded.`)
      } else {
        toast.error('Failed to close day: ' + err.message)
      }
    } finally {
      setClosing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date selector + actions */}
      <Card className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
              Report Date
            </label>
            <input
              type="date"
              value={selectedDate}
              max={toDateString(new Date())}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'oklch(0.58 0.15 350 / 0.3)' } as React.CSSProperties}
            />
          </div>
          <div className="flex items-center gap-2 mt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={!data || loading}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </Button>
            <Button
              size="sm"
              onClick={handleCloseDay}
              disabled={!data || loading || closing}
              className="flex items-center gap-2 cursor-pointer border-0 text-white"
              style={{ backgroundColor: 'oklch(0.58 0.15 350)' }}
            >
              <CheckCircle className="w-4 h-4" />
              {closing ? 'Closing…' : 'Close Day'}
            </Button>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 animate-pulse">
              <div className="w-10 h-10 bg-slate-100 rounded-xl mb-3" />
              <div className="h-6 bg-slate-100 rounded w-24 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-16" />
            </Card>
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Sales', value: formatPrice(data.totalSales), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Total Orders', value: data.totalOrders.toString(), icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Cash Collected', value: formatPrice(data.cashCollected), icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Digital Payments', value: formatPrice(data.digitalTotal), icon: Smartphone, color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map((kpi) => (
              <Card key={kpi.label} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <p className="font-display text-xl font-bold text-slate-900 tabular-nums leading-tight">{kpi.value}</p>
                <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
              </Card>
            ))}
          </div>

          {/* VAT summary */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">VAT Collected (13%)</p>
                <p className="text-xs text-slate-400 mt-0.5">Included in total sales</p>
              </div>
              <p className="font-display text-xl font-bold tabular-nums" style={{ color: 'oklch(0.58 0.15 350)' }}>
                {formatPrice(data.vatCollected)}
              </p>
            </div>
          </Card>

          {/* Product-wise summary */}
          <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
              <Package className="w-5 h-5 text-slate-500" />
              <h3 className="font-display font-semibold text-slate-800">Product-wise Sales Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Product', 'Qty Sold', 'Revenue'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.productSummary.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-5 py-3 tabular-nums text-slate-600">{p.qty}</td>
                      <td className="px-5 py-3 font-semibold tabular-nums text-slate-900">{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                  {data.productSummary.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-400">
                        No sales recorded for this date
                      </td>
                    </tr>
                  )}
                </tbody>
                {data.productSummary.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-900 text-white">
                      <td className="px-5 py-3 font-bold">TOTAL</td>
                      <td className="px-5 py-3 font-bold tabular-nums">
                        {data.productSummary.reduce((s, p) => s + p.qty, 0)}
                      </td>
                      <td className="px-5 py-3 font-bold tabular-nums">{formatPrice(data.totalSales)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>

          {/* Orders list */}
          {data.orders.length > 0 && (
            <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-display font-semibold text-slate-800">
                  All Orders — {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Order #', 'Time', 'Method', 'Total', 'Status'].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.orders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-xs text-slate-800">
                          {o.order_number || o.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(o.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 capitalize">
                          {o.payment_method?.replace(/_/g, ' ') || '—'}
                        </td>
                        <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                          {formatPrice(o.total)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                            ${o.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200'
                              : o.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
