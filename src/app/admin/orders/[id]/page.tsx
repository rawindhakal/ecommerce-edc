import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils'
import {
  ArrowLeft, User, Mail, Phone, CreditCard, Calendar, Package,
  MapPin, Zap, Hash, ShoppingBag
} from 'lucide-react'
import OrderDetailActions from './order-detail-actions'

async function getOrder(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('*, customer:profiles!customer_id(full_name, email, phone, customer_code, loyalty_tier), items:order_items(*)')
    .eq('id', id)
    .single()
  return data
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', esewa: 'eSewa', fonepay: 'FonePay',
  card: 'Card', bank_transfer: 'Bank Transfer', online: 'Online', loyalty_points: 'Loyalty Points',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()

  const items: any[] = order.items || []
  const customer: any = order.customer || {}
  const addr = order.shipping_address as any
  const splits = Array.isArray(order.split_payments) ? order.split_payments : []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="cursor-pointer">
          <Link href="/admin/orders"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl font-bold">{order.order_number}</h1>
            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            {order.is_pos_order && <Badge className="bg-purple-50 text-purple-700 border border-purple-200">POS Sale</Badge>}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5" /> {formatDateTime(order.created_at)}
          </p>
        </div>
        <OrderDetailActions order={order} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: items + totals */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="admin-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold">Order Items</h2>
              <span className="text-sm text-muted-foreground ml-auto">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    {['Item', 'SKU', 'Qty', 'Unit Price', 'Total'].map(h => (
                      <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((it: any) => (
                    <tr key={it.id}>
                      <td className="px-5 py-3 font-medium">{it.product_name}{it.variant_name ? ` · ${it.variant_name}` : ''}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs font-mono">{it.sku || '—'}</td>
                      <td className="px-5 py-3">{it.quantity}</td>
                      <td className="px-5 py-3 tabular-nums">{formatPrice(it.unit_price)}</td>
                      <td className="px-5 py-3 font-semibold tabular-nums">{formatPrice(it.total)}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No line items recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-border p-6">
              <div className="ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{formatPrice(order.subtotal || 0)}</span></div>
                {order.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="tabular-nums">-{formatPrice(order.discount_amount)}</span></div>}
                <div className="flex justify-between text-muted-foreground"><span>VAT (13%)</span><span className="tabular-nums">{formatPrice(order.tax_amount || 0)}</span></div>
                {order.shipping_amount > 0 && <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span className="tabular-nums">{formatPrice(order.shipping_amount)}</span></div>}
                <Separator />
                <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="rose-gold-text tabular-nums">{formatPrice(order.total)}</span></div>
              </div>
            </div>
          </Card>

          {/* Payment breakdown */}
          <Card className="admin-card p-6">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary" /> Payment</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="outline" className="capitalize">{METHOD_LABELS[order.payment_method] || order.payment_method}</Badge>
              <Badge className={order.payment_status === 'paid' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}>
                {order.payment_status}
              </Badge>
            </div>
            {splits.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Split Payments</p>
                {splits.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm border-b border-border pb-1.5 last:border-0">
                    <span className="capitalize">{METHOD_LABELS[s.method] || s.method}{s.reference ? ` · ${s.reference}` : ''}</span>
                    <span className="font-medium tabular-nums">{formatPrice(s.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            {(order.loyalty_points_earned > 0 || order.loyalty_points_used > 0) && (
              <div className="mt-4 flex items-center gap-4 text-xs">
                {order.loyalty_points_earned > 0 && <span className="flex items-center gap-1 text-primary"><Zap className="w-3 h-3" /> +{order.loyalty_points_earned} pts earned</span>}
                {order.loyalty_points_used > 0 && <span className="flex items-center gap-1 text-amber-600"><Zap className="w-3 h-3" /> {order.loyalty_points_used} pts redeemed</span>}
              </div>
            )}
            {order.notes && <p className="mt-4 text-sm text-muted-foreground"><span className="font-medium text-foreground">Note:</span> {order.notes}</p>}
          </Card>
        </div>

        {/* Right: customer + meta */}
        <div className="space-y-6">
          <Card className="admin-card p-6">
            <h2 className="font-display font-semibold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Customer</h2>
            {customer.full_name || customer.email ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-11 h-11">
                    <AvatarFallback className="rose-gold-gradient text-white font-bold">
                      {(customer.full_name || customer.email || '?')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{customer.full_name || 'Customer'}</p>
                    {customer.customer_code && <p className="text-xs text-muted-foreground font-mono">#{customer.customer_code}</p>}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {customer.email && <p className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{customer.email}</span></p>}
                  {customer.phone && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5 shrink-0" />{customer.phone}</p>}
                  {customer.loyalty_tier && <p className="flex items-center gap-2 text-muted-foreground capitalize"><Zap className="w-3.5 h-3.5 shrink-0" />{customer.loyalty_tier} member</p>}
                </div>
                {order.customer_id && (
                  <Button variant="outline" size="sm" className="w-full cursor-pointer" asChild>
                    <Link href={`/admin/customers/${order.customer_id}`}>View Customer Profile</Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Guest / Walk-in customer</p>
            )}
          </Card>

          {addr && (
            <Card className="admin-card p-6">
              <h2 className="font-display font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Shipping Address</h2>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p className="text-foreground font-medium">{addr.full_name}</p>
                <p>{addr.address_line1}</p>
                {addr.address_line2 && <p>{addr.address_line2}</p>}
                <p>{[addr.city, addr.state, addr.postal_code].filter(Boolean).join(', ')}</p>
                {addr.phone && <p>{addr.phone}</p>}
              </div>
            </Card>
          )}

          <Card className="admin-card p-6">
            <h2 className="font-display font-semibold mb-3 flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /> Order Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Order #</span><span className="font-mono font-medium">{order.order_number}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Channel</span><span>{order.is_pos_order ? 'In-store POS' : 'Online'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Placed</span><span>{formatDateTime(order.created_at)}</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
