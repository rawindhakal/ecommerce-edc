import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatPrice, formatDate, formatDateTime, getStatusColor, getLoyaltyTierBg } from '@/lib/utils'
import {
  ArrowLeft, Phone, Mail, User, Zap, ShoppingBag, Trophy,
  TrendingUp, Calendar, Package, CreditCard
} from 'lucide-react'
import Link from 'next/link'
import LoyaltyAdjustClient from './loyalty-adjust-client'

async function getCustomerDetail(id: string) {
  const supabase = await createClient()
  const [profileRes, ordersRes, loyaltyRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('orders').select('*').eq('customer_id', id).order('created_at', { ascending: false }).limit(50),
    supabase.from('loyalty_transactions').select('*').eq('customer_id', id).order('created_at', { ascending: false }).limit(30),
  ])
  return {
    profile: profileRes.data,
    orders: ordersRes.data || [],
    loyalty: loyaltyRes.data || [],
  }
}

const TIER_ICONS: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' }
const TIER_NAMES: Record<string, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }
const NEXT_TIER: Record<string, number | null> = { bronze: 500, silver: 2000, gold: 5000, platinum: null }

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { profile, orders, loyalty } = await getCustomerDetail(id)
  if (!profile) notFound()

  const tier: string = profile.loyalty_tier || 'bronze'
  const points = profile.loyalty_points || 0
  const nextTierPts = NEXT_TIER[tier as keyof typeof NEXT_TIER]
  const tierMinMap: Record<string, number> = { bronze: 0, silver: 500, gold: 2000, platinum: 5000 }
  const currMin = tierMinMap[tier] || 0
  const progress = nextTierPts ? Math.min(100, ((points - currMin) / (nextTierPts - currMin)) * 100) : 100

  const totalOrders = orders.length
  const totalSpent = orders.filter((o: any) => o.status === 'delivered').reduce((s: number, o: any) => s + o.total, 0)
  const avgOrder = totalOrders > 0 ? totalSpent / totalOrders : 0
  const lastOrder = orders[0]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="cursor-pointer">
          <Link href="/admin/customers"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">{profile.full_name || 'Unnamed Customer'}</h1>
          <p className="text-sm text-muted-foreground">Customer #{profile.customer_code || '—'}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge className={`bg-gradient-to-r ${getLoyaltyTierBg(tier)} text-white border-0`}>
            {TIER_ICONS[tier]} {TIER_NAMES[tier]}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="space-y-4">
          <Card className="admin-card p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar className="w-20 h-20 mb-3">
                <AvatarFallback className="rose-gold-gradient text-white text-2xl font-bold">
                  {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-display font-semibold text-lg">{profile.full_name || 'Unnamed'}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Badge className="mt-2 bg-green-50 text-green-700 border-green-200 border text-xs">Active</Badge>
            </div>

            <div className="space-y-3 text-sm">
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{profile.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <code className="font-mono font-bold text-primary">#{profile.customer_code || '—'}</code>
              </div>
            </div>
          </Card>

          {/* Loyalty card */}
          <Card className="admin-card overflow-hidden">
            <div className={`bg-gradient-to-br ${getLoyaltyTierBg(tier)} p-5 text-white`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium opacity-80">Loyalty Points</span>
                <span className="text-2xl">{TIER_ICONS[tier]}</span>
              </div>
              <p className="font-display text-3xl font-bold">{points.toLocaleString()}</p>
              <p className="text-sm opacity-70 mt-0.5">{TIER_NAMES[tier]} Member</p>
              {nextTierPts && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs opacity-70 mb-1">
                    <span>{points} pts</span>
                    <span>{nextTierPts} pts needed</span>
                  </div>
                  <div className="w-full bg-white/25 rounded-full h-1.5">
                    <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs opacity-70 mt-1">{nextTierPts - points} pts to next tier</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <LoyaltyAdjustClient
                customerId={id}
                customerName={profile.full_name || profile.email}
                currentPoints={points}
              />
            </div>
          </Card>
        </div>

        {/* Right: Stats + Orders + Loyalty history */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Orders', value: totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total Spent', value: formatPrice(totalSpent), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Avg Order', value: formatPrice(avgOrder), icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Points', value: points.toLocaleString(), icon: Zap, color: 'text-primary', bg: 'bg-primary/5' },
            ].map(s => (
              <Card key={s.label} className="admin-card p-4">
                <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="font-bold text-base">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Order history */}
          <Card className="admin-card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-base">Order History</h2>
              <span className="text-sm text-muted-foreground">{totalOrders} orders</span>
            </div>
            {orders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-sm font-semibold">{order.order_number}</span>
                        <Badge className={`text-xs ${getStatusColor(order.status)}`}>{order.status}</Badge>
                        {order.is_pos_order && <Badge className="text-xs bg-purple-50 text-purple-700 border-purple-200 border">POS</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.created_at)}</p>
                      {order.loyalty_points_earned > 0 && (
                        <p className="text-xs text-primary mt-0.5 flex items-center gap-1">
                          <Zap className="w-3 h-3" />+{order.loyalty_points_earned} pts earned
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">{formatPrice(order.total)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.payment_method?.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Loyalty history */}
          {loyalty.length > 0 && (
            <Card className="admin-card">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-display font-semibold text-base">Loyalty Point History</h2>
              </div>
              <div className="divide-y divide-border">
                {loyalty.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${tx.type === 'earn' || (tx.type === 'adjust' && tx.points > 0) ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points} pts
                      </p>
                      <p className="text-xs text-muted-foreground">Balance: {tx.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
