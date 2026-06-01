import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate, getStatusColor } from '@/lib/utils'
import {
  TrendingUp, ShoppingCart, Users, Package, AlertTriangle,
  ArrowUp, ArrowDown, DollarSign, Zap
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getDashboardData() {
  const supabase = await createClient()
  const [ordersRes, customersRes, productsRes, revenueRes, lowStockRes, recentOrdersRes] = await Promise.all([
    supabase.from('orders').select('id, total, status, created_at').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id').eq('role', 'customer'),
    supabase.from('products').select('id').eq('is_active', true),
    supabase.from('orders').select('total').eq('status', 'delivered'),
    supabase.from('inventory').select('product_id, quantity, low_stock_threshold, products(name)').filter('quantity', 'lte', 'low_stock_threshold'),
    supabase.from('orders').select('*, customer:profiles!customer_id(full_name, email)').order('created_at', { ascending: false }).limit(8),
  ])

  const orders = ordersRes.data || []
  const totalRevenue = revenueRes.data?.reduce((s, o) => s + o.total, 0) || 0
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
  const pendingOrders = orders.filter(o => o.status === 'pending')

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalCustomers: customersRes.data?.length || 0,
    totalProducts: productsRes.data?.length || 0,
    todayOrders: todayOrders.length,
    pendingOrders: pendingOrders.length,
    lowStockItems: (lowStockRes.data || []).slice(0, 5),
    recentOrders: recentOrdersRes.data || [],
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  const statCards = [
    {
      title: 'Total Revenue', value: formatPrice(data.totalRevenue),
      icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100',
      change: '+12.5%', up: true, sub: 'From delivered orders'
    },
    {
      title: 'Total Orders', value: data.totalOrders.toLocaleString(),
      icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100',
      change: `${data.todayOrders} today`, up: true, sub: `${data.pendingOrders} pending`
    },
    {
      title: 'Customers', value: data.totalCustomers.toLocaleString(),
      icon: Users, color: 'text-purple-600', bg: 'bg-purple-100',
      change: '+8.2%', up: true, sub: 'Registered members'
    },
    {
      title: 'Active Products', value: data.totalProducts.toLocaleString(),
      icon: Package, color: 'text-rose-600', bg: 'bg-rose-100',
      change: `${data.lowStockItems.length} low stock`, up: false, sub: 'In store catalog'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Welcome back. Here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer" asChild>
            <Link href="/admin/pos">Open POS</Link>
          </Button>
          <Button size="sm" className="rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer" asChild>
            <Link href="/admin/products/new">+ Add Product</Link>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <Card key={stat.title} className="p-6 admin-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.up ? 'text-green-600' : 'text-amber-600'}`}>
                {stat.up ? <ArrowUp className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <p className="font-display text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{stat.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card className="admin-card">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display font-semibold text-lg">Recent Orders</h2>
              <Button variant="ghost" size="sm" asChild className="cursor-pointer text-primary">
                <Link href="/admin/orders">View All</Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {data.recentOrders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No orders yet</div>
              ) : data.recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rose-gold-gradient/10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer?.full_name || order.customer?.email || 'Guest'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`text-xs ${getStatusColor(order.status)}`}>{order.status}</Badge>
                    <span className="font-semibold text-sm">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Low Stock Alert */}
        <div className="space-y-4">
          <Card className="admin-card">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display font-semibold text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Low Stock Alert
              </h2>
              <Button variant="ghost" size="sm" asChild className="cursor-pointer text-primary text-xs">
                <Link href="/admin/inventory">Manage</Link>
              </Button>
            </div>
            <div className="divide-y divide-border">
              {data.lowStockItems.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">All items well stocked ✓</div>
              ) : data.lowStockItems.map((item: any) => (
                <div key={item.product_id} className="flex items-center justify-between px-6 py-3">
                  <p className="text-sm font-medium truncate flex-1 mr-2">{item.products?.name}</p>
                  <Badge variant="destructive" className="text-xs shrink-0">{item.quantity} left</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 admin-card">
            <h2 className="font-display font-semibold text-base mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: 'Process Pending Orders', href: '/admin/orders?status=pending', icon: ShoppingCart },
                { label: 'Restock Low Items', href: '/admin/inventory', icon: Package },
                { label: 'Open POS Terminal', href: '/admin/pos', icon: Zap },
                { label: 'View Loyalty Report', href: '/admin/loyalty', icon: TrendingUp },
              ].map(action => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium cursor-pointer group"
                >
                  <action.icon className="w-4 h-4 text-primary" />
                  {action.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
