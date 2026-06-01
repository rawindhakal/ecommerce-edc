import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatPrice, formatDate, getLoyaltyTierBg } from '@/lib/utils'
import { Users, Phone, UserPlus, ChevronRight, TrendingUp, ShoppingBag, Zap } from 'lucide-react'
import Link from 'next/link'
import AddCustomerDialog from './add-customer-dialog'
import CustomerSearchInput from './customer-search-input'

async function getCustomers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id,full_name,email,phone,customer_code,loyalty_tier,loyalty_points,total_spent,role,created_at,is_active')
    .eq('role', 'customer')
    .order('total_spent', { ascending: false })
  return data || []
}

async function getStats() {
  const supabase = await createClient()
  const { data: customers } = await supabase.from('profiles').select('loyalty_tier,total_spent,loyalty_points').eq('role', 'customer')
  const total = customers?.length || 0
  const totalRevenue = customers?.reduce((s: number, c: any) => s + (c.total_spent || 0), 0) || 0
  const totalPoints = customers?.reduce((s: number, c: any) => s + (c.loyalty_points || 0), 0) || 0
  const platinum = customers?.filter((c: any) => c.loyalty_tier === 'platinum').length || 0
  const gold = customers?.filter((c: any) => c.loyalty_tier === 'gold').length || 0
  return { total, totalRevenue, totalPoints, vip: platinum + gold }
}

const TIER_ICONS: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎' }
const TIER_COLORS: Record<string, string> = {
  bronze: 'bg-amber-50 text-amber-700 border-amber-200',
  silver: 'bg-slate-50 text-slate-600 border-slate-200',
  gold: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  platinum: 'bg-purple-50 text-purple-700 border-purple-200',
}

export default async function CustomersPage() {
  const [customers, stats] = await Promise.all([getCustomers(), getStats()])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">{stats.total} registered members</p>
        </div>
        <AddCustomerDialog />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Points Issued', value: stats.totalPoints.toLocaleString(), icon: Zap, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'VIP Members', value: stats.vip, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <Card key={s.label} className="admin-card p-5">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="font-bold text-xl text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Customer Table */}
      <Card className="admin-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <CustomerSearchInput />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {['Code', 'Customer', 'Contact', 'Loyalty', 'Spent', 'Points', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((c: any) => (
                <tr
                  key={c.id}
                  data-customer-row
                  data-search={`${c.full_name || ''} ${c.email || ''} ${c.phone || ''} ${c.customer_code || ''}`.toLowerCase()}
                  className="hover:bg-muted/20 transition-colors group"
                >
                  <td className="px-4 py-3.5">
                    <code className="font-mono text-sm font-bold text-primary bg-primary/8 px-2 py-0.5 rounded">
                      #{c.customer_code || '—'}
                    </code>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarFallback className="rose-gold-gradient text-white text-sm font-bold">
                          {(c.full_name || c.email || '?')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{c.full_name || 'Unnamed'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {c.phone
                      ? <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="w-3.5 h-3.5" />{c.phone}</div>
                      : <span className="text-xs text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge className={`${TIER_COLORS[c.loyalty_tier] || TIER_COLORS.bronze} border text-xs font-medium`}>
                      {TIER_ICONS[c.loyalty_tier]} {c.loyalty_tier}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-sm">{formatPrice(c.total_spent || 0)}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-primary">{(c.loyalty_points || 0).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-1">pts</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge className={c.is_active !== false ? 'bg-green-50 text-green-700 border-green-200 border text-xs' : 'bg-red-50 text-red-600 border-red-200 border text-xs'}>
                      {c.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {customers.length === 0 && (
            <div className="py-20 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-display font-semibold text-lg mb-1">No customers yet</p>
              <p className="text-sm text-muted-foreground">Customers appear here after they sign up or are added via POS</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export const dynamic = 'force-dynamic'
