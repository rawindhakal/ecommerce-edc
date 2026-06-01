// FILE: src/app/admin/analytics/analytics-charts.tsx
'use client'

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts'

const ROSE_GOLD = 'oklch(0.58 0.15 350)'
const COLORS = ['#C9728A', '#D4AF8C', '#9B7BAE', '#B76E79', '#7FADA8', '#CD7F32', '#C0C0C0', '#E8A0B0']
const TIER_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#A0AEC0',
  gold: '#ECC94B',
  platinum: '#CBD5E0',
}
const STATUS_COLORS: Record<string, string> = {
  pending: '#F6AD55',
  confirmed: '#68D391',
  processing: '#9F7AEA',
  shipped: '#63B3ED',
  delivered: '#48BB78',
  cancelled: '#FC8181',
  refunded: '#A0AEC0',
}

function formatNPR(amount: number) {
  return 'Rs. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

function formatNPRShort(amount: number) {
  if (amount >= 100000) return 'Rs. ' + (amount / 100000).toFixed(1) + 'L'
  if (amount >= 1000) return 'Rs. ' + (amount / 1000).toFixed(1) + 'K'
  return 'Rs. ' + amount.toFixed(0)
}

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  padding: '10px 14px',
  fontSize: '13px',
}

interface AnalyticsData {
  monthlyRevenue: Array<{ month: string; revenue: number }>
  topProducts: Array<{ name: string; qty: number; revenue: number }>
  statusData: Array<{ status: string; count: number }>
  tierData: Array<{ tier: string; count: number }>
  paymentData: Array<{ method: string; count: number }>
  dailySales: Array<{ date: string; revenue: number; orders: number }>
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
        <span className="text-lg">📊</span>
      </div>
      <p className="text-sm">{message}</p>
    </div>
  )
}

export default function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  const dailySalesWithFallback = data.dailySales?.length ? data.dailySales : data.monthlyRevenue.map(d => ({
    date: d.month,
    revenue: d.revenue,
    orders: 0,
  }))

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* 1. Daily Sales Trend */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-2">
        <div className="mb-5">
          <h2 className="font-display font-semibold text-lg text-slate-800">Sales Trend</h2>
          <p className="text-xs text-slate-500 mt-0.5">Revenue over the selected period</p>
        </div>
        {dailySalesWithFallback.length === 0 ? (
          <EmptyState message="No sales data for this period" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailySalesWithFallback} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v: unknown) => typeof v === 'number' ? formatNPRShort(v) : String(v)}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: unknown) => typeof v === 'number' ? formatNPR(v) : String(v)}
                labelStyle={{ color: '#64748b', fontWeight: 500, marginBottom: 4 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={ROSE_GOLD}
                strokeWidth={2.5}
                dot={{ r: 4, fill: ROSE_GOLD, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: ROSE_GOLD }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 2. Revenue by Product */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="mb-5">
          <h2 className="font-display font-semibold text-lg text-slate-800">Top Products by Revenue</h2>
          <p className="text-xs text-slate-500 mt-0.5">Highest grossing products</p>
        </div>
        {data.topProducts.length === 0 ? (
          <EmptyState message="No product sales data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.topProducts.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v: unknown) => typeof v === 'number' ? formatNPRShort(v) : String(v)}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + '…' : v}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: unknown) => typeof v === 'number' ? formatNPR(v) : String(v)}
                labelStyle={{ color: '#64748b', fontWeight: 500 }}
              />
              <Bar dataKey="revenue" name="Revenue" fill="#D4AF8C" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 3. Order Status Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="mb-5">
          <h2 className="font-display font-semibold text-lg text-slate-800">Order Status</h2>
          <p className="text-xs text-slate-500 mt-0.5">Distribution across statuses</p>
        </div>
        {data.statusData.length === 0 ? (
          <EmptyState message="No order data yet" />
        ) : (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={data.statusData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {data.statusData.map((item, i) => (
                    <Cell key={item.status} fill={STATUS_COLORS[item.status] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [typeof v === 'number' ? v : String(v), 'Orders']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 min-w-0">
              {data.statusData.map((item, i) => (
                <div key={item.status} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[item.status] || COLORS[i % COLORS.length] }}
                  />
                  <span className="capitalize text-slate-600 flex-1 truncate">{item.status}</span>
                  <span className="font-semibold text-slate-800 tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Payment Methods Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="mb-5">
          <h2 className="font-display font-semibold text-lg text-slate-800">Payment Methods</h2>
          <p className="text-xs text-slate-500 mt-0.5">How customers pay</p>
        </div>
        {data.paymentData.length === 0 ? (
          <EmptyState message="No payment data yet" />
        ) : (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={data.paymentData}
                  dataKey="count"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {data.paymentData.map((_item, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: unknown) => [typeof v === 'number' ? v : String(v), 'Transactions']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 min-w-0">
              {data.paymentData.map((item, i) => (
                <div key={item.method} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-slate-600 flex-1 truncate capitalize">
                    {item.method === 'bank_transfer' ? 'Bank Transfer'
                      : item.method === 'esewa' ? 'eSewa'
                      : item.method === 'fonepay' ? 'FonePay'
                      : item.method === 'cash' ? 'Cash'
                      : item.method === 'card' ? 'Card'
                      : item.method}
                  </span>
                  <span className="font-semibold text-slate-800 tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Loyalty Tier Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="mb-5">
          <h2 className="font-display font-semibold text-lg text-slate-800">Customer Tier Distribution</h2>
          <p className="text-xs text-slate-500 mt-0.5">Members by loyalty tier</p>
        </div>
        {data.tierData.length === 0 ? (
          <EmptyState message="No customer tier data yet" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.tierData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="tier"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: unknown) => [typeof v === 'number' ? v : String(v), 'Members']}
                labelFormatter={(v: unknown) => typeof v === "string" ? v.charAt(0).toUpperCase() + v.slice(1) : String(v)}
              />
              <Bar dataKey="count" name="Members" radius={[5, 5, 0, 0]}>
                {data.tierData.map((item) => (
                  <Cell key={item.tier} fill={TIER_COLORS[item.tier] || '#C9728A'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
