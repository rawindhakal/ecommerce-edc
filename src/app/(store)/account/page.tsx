'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/store/auth-context'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatPrice, formatDate, getStatusColor, getLoyaltyTierBg } from '@/lib/utils'
import { Zap, Package, User, Trophy, ArrowRight, Crown, Star } from 'lucide-react'
import type { Order, LoyaltyTransaction, LoyaltyTierConfig } from '@/types/supabase'
import Link from 'next/link'

const TIER_THRESHOLDS = { bronze: 0, silver: 500, gold: 2000, platinum: 5000 }
const NEXT_TIER = { bronze: 500, silver: 2000, gold: 5000, platinum: null }
const TIER_NAMES = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' }
const TIER_ICONS = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' }

export default function AccountPage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loyaltyTx, setLoyaltyTx] = useState<LoyaltyTransaction[]>([])
  const [tierConfig, setTierConfig] = useState<LoyaltyTierConfig[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    async function loadData() {
      const [ordersRes, loyaltyRes, tiersRes] = await Promise.all([
        supabase.from('orders').select('*, items:order_items(*)').eq('customer_id', user!.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('loyalty_transactions').select('*').eq('customer_id', user!.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('loyalty_tiers_config').select('*').order('min_points'),
      ])
      setOrders((ordersRes.data as Order[]) || [])
      setLoyaltyTx((loyaltyRes.data as LoyaltyTransaction[]) || [])
      setTierConfig(tiersRes.data || [])
      setDataLoading(false)
    }
    loadData()
  }, [user])

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) return null

  const tier = profile.loyalty_tier
  const points = profile.loyalty_points
  const nextTierPts = NEXT_TIER[tier as keyof typeof NEXT_TIER]
  const currTierPts = TIER_THRESHOLDS[tier as keyof typeof TIER_THRESHOLDS]
  const progress = nextTierPts
    ? Math.min(100, ((points - currTierPts) / (nextTierPts - currTierPts)) * 100)
    : 100

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 py-8">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="rose-gold-gradient text-white text-2xl font-display">
              {profile.full_name?.[0] || profile.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-2xl font-bold">{profile.full_name || 'Beauty Lover'}</h1>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <Badge className={`bg-gradient-to-r ${getLoyaltyTierBg(tier)} text-white border-0 font-medium`}>
                {TIER_ICONS[tier as keyof typeof TIER_ICONS]} {TIER_NAMES[tier as keyof typeof TIER_NAMES]} Member
              </Badge>
              <span className="text-sm text-muted-foreground">
                Member since {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
          <Button variant="outline" onClick={signOut} size="sm" className="cursor-pointer">Sign Out</Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Loyalty Points', value: points.toLocaleString(), icon: Zap, color: 'text-primary' },
            { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-blue-500' },
            { label: 'Total Spent', value: formatPrice(profile.total_spent), icon: Crown, color: 'text-amber-500' },
            { label: 'Tier', value: TIER_NAMES[tier as keyof typeof TIER_NAMES], icon: Trophy, color: 'text-rose-500' },
          ].map(stat => (
            <Card key={stat.label} className="p-4 text-center bg-white/60 backdrop-blur-sm border-white/60">
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="font-bold text-lg">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="loyalty">
          <TabsList className="mb-6 glass border-white/40">
            <TabsTrigger value="loyalty" className="cursor-pointer">Rewards</TabsTrigger>
            <TabsTrigger value="orders" className="cursor-pointer">Orders</TabsTrigger>
            <TabsTrigger value="profile" className="cursor-pointer">Profile</TabsTrigger>
          </TabsList>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty" className="space-y-6">
            {/* Current Tier Card */}
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getLoyaltyTierBg(tier)} p-8 text-white`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Your Tier</p>
                  <h2 className="font-display text-3xl font-bold flex items-center gap-2">
                    {TIER_ICONS[tier as keyof typeof TIER_ICONS]}
                    {TIER_NAMES[tier as keyof typeof TIER_NAMES]}
                  </h2>
                  <p className="text-white/80 mt-1">
                    <span className="font-bold text-2xl">{points.toLocaleString()}</span> points
                  </p>
                </div>
                <Trophy className="w-16 h-16 text-white/20" />
              </div>

              {nextTierPts && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-white/70 mb-2">
                    <span>{points.toLocaleString()} pts</span>
                    <span>{nextTierPts.toLocaleString()} pts to {TIER_NAMES[Object.keys(NEXT_TIER)[Object.values(NEXT_TIER).indexOf(nextTierPts)] as keyof typeof TIER_NAMES]}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white rounded-full h-2 transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-white/70 text-xs mt-2">
                    Earn {(nextTierPts - points).toLocaleString()} more points to unlock next tier
                  </p>
                </div>
              )}
            </div>

            {/* Tier Benefits */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tierConfig.map(config => (
                <Card key={config.tier} className={`p-4 border-2 bg-white/60 backdrop-blur-sm ${config.tier === tier ? 'border-primary' : 'border-transparent'}`}>
                  <div className="text-2xl mb-2">{config.icon}</div>
                  <h3 className="font-display font-semibold">{config.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{config.min_points.toLocaleString()}+ pts</p>
                  <ul className="space-y-1">
                    {config.benefits?.slice(0, 3).map((b, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <Star className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  {config.tier === tier && (
                    <Badge className="mt-3 rose-gold-gradient border-0 text-white text-[10px]">Current Tier</Badge>
                  )}
                </Card>
              ))}
            </div>

            {/* Transaction History */}
            <Card className="bg-white/60 backdrop-blur-sm border-white/60">
              <div className="p-6 border-b border-border">
                <h3 className="font-display font-semibold text-lg">Points History</h3>
              </div>
              <div className="divide-y divide-border">
                {loyaltyTx.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No transactions yet. Start shopping to earn points!</p>
                  </div>
                ) : loyaltyTx.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">{tx.description || (tx.type === 'earn' ? 'Points earned' : 'Points redeemed')}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.points)} pts
                      </p>
                      <p className="text-xs text-muted-foreground">Balance: {tx.balance_after}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="bg-white/60 backdrop-blur-sm border-white/60">
              <div className="p-6 border-b border-border">
                <h3 className="font-display font-semibold text-lg">Order History</h3>
              </div>
              {orders.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                  <p className="font-display font-semibold text-lg mb-2">No orders yet</p>
                  <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                  <Button asChild className="cursor-pointer rose-gold-gradient border-0 text-white hover:opacity-90">
                    <Link href="/shop">Start Shopping <ArrowRight className="ml-2 w-4 h-4" /></Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map(order => (
                    <div key={order.id} className="p-6 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{order.order_number}</span>
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                          {order.loyalty_points_earned > 0 && (
                            <p className="text-xs text-primary mt-1 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Earned {order.loyalty_points_earned} points
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold">{formatPrice(order.total)}</p>
                          <p className="text-xs text-muted-foreground">{order.items?.length || 0} items</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="p-6 bg-white/60 backdrop-blur-sm border-white/60">
              <h3 className="font-display font-semibold text-lg mb-6">Personal Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', value: profile.full_name || 'Not set' },
                  { label: 'Email', value: profile.email },
                  { label: 'Phone', value: profile.phone || 'Not set' },
                  { label: 'Member Since', value: formatDate(profile.created_at) },
                ].map(field => (
                  <div key={field.label}>
                    <label className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{field.label}</label>
                    <p className="mt-1 text-sm font-medium">{field.value}</p>
                  </div>
                ))}
              </div>
              <Separator className="my-6" />
              <Button variant="outline" size="sm" className="cursor-pointer">Edit Profile</Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
