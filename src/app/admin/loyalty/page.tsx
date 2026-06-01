import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatPrice, getLoyaltyTierBg } from '@/lib/utils'
import { Trophy, Users, Zap, TrendingUp } from 'lucide-react'
import LoyaltyPointsAdjuster from './loyalty-adjuster'

async function getLoyaltyData() {
  const supabase = await createClient()
  const [customersRes, txRes, tiersRes] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, loyalty_tier, loyalty_points, total_spent').eq('role', 'customer').order('loyalty_points', { ascending: false }),
    supabase.from('loyalty_transactions').select('*').order('created_at', { ascending: false }).limit(30),
    supabase.from('loyalty_tiers_config').select('*').order('min_points'),
  ])
  return {
    customers: customersRes.data || [],
    transactions: txRes.data || [],
    tiers: tiersRes.data || [],
  }
}

const TIER_ICONS = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' }

export default async function LoyaltyPage() {
  const { customers, transactions, tiers } = await getLoyaltyData()
  const totalPoints = customers.reduce((s: number, c: any) => s + c.loyalty_points, 0)
  const tierCounts = customers.reduce((acc: Record<string, number>, c: any) => {
    acc[c.loyalty_tier] = (acc[c.loyalty_tier] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Loyalty Program</h1>
        <p className="text-muted-foreground text-sm">Manage customer rewards and tiers</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: customers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Points Issued', value: totalPoints.toLocaleString(), icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Gold+ Members', value: (tierCounts.gold || 0) + (tierCounts.platinum || 0), icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Transactions', value: transactions.length, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
        ].map(stat => (
          <Card key={stat.label} className="p-5 admin-card">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="font-bold text-2xl">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Tier Distribution */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier: any) => (
          <Card key={tier.tier} className="p-5 admin-card">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${getLoyaltyTierBg(tier.tier)} text-white text-sm font-medium mb-3`}>
              <span>{TIER_ICONS[tier.tier as keyof typeof TIER_ICONS]}</span>
              {tier.name}
            </div>
            <p className="font-bold text-2xl">{tierCounts[tier.tier] || 0}</p>
            <p className="text-xs text-muted-foreground">{tier.min_points.toLocaleString()}+ points</p>
            <div className="mt-2 space-y-0.5">
              <p className="text-xs text-muted-foreground">{tier.discount_percent}% discount</p>
              <p className="text-xs text-muted-foreground">{tier.points_multiplier}x multiplier</p>
              {tier.free_shipping && <p className="text-xs text-green-600">Free shipping</p>}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Members */}
        <Card className="admin-card">
          <div className="p-6 border-b border-border">
            <h2 className="font-display font-semibold text-lg">Top Members by Points</h2>
          </div>
          <div className="divide-y divide-border">
            {customers.slice(0, 10).map((customer: any, i: number) => (
              <div key={customer.id} className="flex items-center gap-4 px-6 py-4">
                <span className="w-6 text-sm font-bold text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{customer.full_name || customer.email}</p>
                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge className={`bg-gradient-to-r ${getLoyaltyTierBg(customer.loyalty_tier)} text-white border-0 text-xs`}>
                    {TIER_ICONS[customer.loyalty_tier as keyof typeof TIER_ICONS]} {customer.loyalty_tier}
                  </Badge>
                  <p className="text-sm font-bold mt-1 text-primary">{customer.loyalty_points.toLocaleString()} pts</p>
                </div>
                <LoyaltyPointsAdjuster customerId={customer.id} customerName={customer.full_name || customer.email} currentPoints={customer.loyalty_points} />
              </div>
            ))}
            {customers.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No customers yet</div>
            )}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="admin-card">
          <div className="p-6 border-b border-border">
            <h2 className="font-display font-semibold text-lg">Recent Point Activity</h2>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {transactions.slice(0, 15).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                </div>
                <div className={`font-semibold text-sm shrink-0 ${tx.type === 'earn' ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.type === 'earn' ? '+' : ''}{tx.points}
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No activity yet</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
