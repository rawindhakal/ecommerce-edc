import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { Package, AlertTriangle, TrendingDown, TrendingUp, Warehouse } from 'lucide-react'
import InventoryActions from './inventory-actions'
import Image from 'next/image'

async function getInventoryData() {
  const supabase = await createClient()
  const [inventoryRes, txRes] = await Promise.all([
    supabase
      .from('inventory')
      .select('*, product:products(id, name, sku, price, images, is_active)')
      .order('quantity', { ascending: true }),
    supabase
      .from('inventory_transactions')
      .select('*, product:products(name), performer:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])
  return {
    inventory: inventoryRes.data || [],
    transactions: txRes.data || [],
  }
}

function getStockStatus(qty: number, threshold: number) {
  if (qty === 0) return { label: 'Out of Stock', class: 'bg-red-100 text-red-700 border-red-200' }
  if (qty <= threshold) return { label: 'Low Stock', class: 'bg-amber-100 text-amber-700 border-amber-200' }
  return { label: 'In Stock', class: 'bg-green-100 text-green-700 border-green-200' }
}

export default async function InventoryPage() {
  const { inventory, transactions } = await getInventoryData()
  const outOfStock = inventory.filter((i: any) => i.quantity === 0).length
  const lowStock = inventory.filter((i: any) => i.quantity > 0 && i.quantity <= i.low_stock_threshold).length
  const inStock = inventory.filter((i: any) => i.quantity > i.low_stock_threshold).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground text-sm">{inventory.length} products tracked</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'In Stock', value: inStock, icon: Package, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Low Stock', value: lowStock, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Out of Stock', value: outOfStock, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
        ].map(stat => (
          <Card key={stat.label} className="p-4 admin-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="font-bold text-xl">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inventory Table */}
        <div className="lg:col-span-2">
          <Card className="admin-card overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-primary" /> Stock Levels
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">Product</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">Qty</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Threshold</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inventory.map((item: any) => {
                    const status = getStockStatus(item.quantity, item.low_stock_threshold)
                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                              {item.product?.images?.[0] ? (
                                <Image src={item.product.images[0].url} alt={item.product.name} fill className="object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-muted-foreground/40 m-auto" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm truncate max-w-[160px]">{item.product?.name}</p>
                              <p className="text-xs text-muted-foreground">{item.product?.sku || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`font-bold text-lg ${item.quantity === 0 ? 'text-destructive' : item.quantity <= item.low_stock_threshold ? 'text-amber-600' : 'text-green-600'}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-muted-foreground hidden sm:table-cell">
                          {item.low_stock_threshold}
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={status.class}>{status.label}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <InventoryActions
                            inventoryId={item.id}
                            productId={item.product?.id}
                            productName={item.product?.name || 'Product'}
                            currentQty={item.quantity}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div>
          <Card className="admin-card">
            <div className="p-6 border-b border-border">
              <h2 className="font-display font-semibold text-lg">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No transactions yet</div>
              ) : transactions.map((tx: any) => (
                <div key={tx.id} className="px-6 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.product?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{tx.action}</p>
                      <p className="text-[10px] text-muted-foreground/60">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`flex items-center gap-0.5 font-semibold text-sm ${tx.quantity_change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.quantity_change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {tx.quantity_change > 0 ? '+' : ''}{tx.quantity_change}
                      </div>
                      <p className="text-xs text-muted-foreground">→ {tx.quantity_after}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
