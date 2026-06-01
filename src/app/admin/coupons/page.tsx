import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils'
import { Tag, Plus } from 'lucide-react'
import CouponForm from './coupon-form'

async function getCoupons() {
  const supabase = await createClient()
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  return data || []
}

export default async function CouponsPage() {
  const coupons = await getCoupons()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Coupons</h1>
          <p className="text-muted-foreground text-sm">{coupons.length} discount codes</p>
        </div>
        <CouponForm />
      </div>

      <Card className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Code', 'Discount', 'Min Order', 'Usage', 'Valid Until', 'Status'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.map((coupon: any) => (
                <tr key={coupon.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <code className="font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded text-sm">{coupon.code}</code>
                    {coupon.description && <p className="text-xs text-muted-foreground mt-0.5">{coupon.description}</p>}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : formatPrice(coupon.discount_value)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{coupon.minimum_order > 0 ? formatPrice(coupon.minimum_order) : '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    {coupon.used_count}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {coupon.valid_until ? formatDate(coupon.valid_until) : 'No expiry'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={coupon.is_active ? 'default' : 'secondary'} className={coupon.is_active ? 'bg-green-100 text-green-700 border-green-200' : ''}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {coupons.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No coupons yet. Create your first discount code.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export const dynamic = 'force-dynamic'
