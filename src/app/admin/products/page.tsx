import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils'
import { Plus, Package, Edit, Eye, Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types/supabase'
import ProductActions from './product-actions'
import BulkActions from './bulk-actions'

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(name), inventory(quantity, low_stock_threshold)')
    .order('created_at', { ascending: false })
  return (data as Product[]) || []
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm">{products.length} products in catalog</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <BulkActions products={products} />
          <Button className="rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer" asChild>
            <Link href="/admin/products/new"><Plus className="w-4 h-4 mr-2" /> Add Product</Link>
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search" placeholder="Search products by name, SKU..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white/80 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <Card className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">Price</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Status</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map(product => {
                const inventory = (product as any).inventory?.[0]
                const stockQty = inventory?.quantity ?? 0
                const isLowStock = stockQty > 0 && stockQty <= (inventory?.low_stock_threshold ?? 10)

                return (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                          {product.images?.[0] ? (
                            <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground/40" /></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[180px]">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku || 'No SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground">{(product as any).category?.name || '—'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <span className="font-semibold text-sm">{formatPrice(product.price)}</span>
                        {product.compare_at_price && (
                          <p className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={`text-sm font-medium ${stockQty === 0 ? 'text-destructive' : isLowStock ? 'text-amber-600' : 'text-green-600'}`}>
                        {stockQty}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex flex-col gap-1">
                        <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-xs w-fit">
                          {product.is_active ? 'Active' : 'Draft'}
                        </Badge>
                        {product.is_featured && <Badge className="rose-gold-gradient border-0 text-white text-xs w-fit">Featured</Badge>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="cursor-pointer h-8 w-8" asChild>
                          <Link href={`/product/${product.slug}`} target="_blank" aria-label="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="cursor-pointer h-8 w-8" asChild>
                          <Link href={`/admin/products/${product.id}/edit`} aria-label="Edit">
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                        <ProductActions productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="py-16 text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-display font-semibold text-lg mb-2">No products yet</p>
              <Button asChild className="cursor-pointer rose-gold-gradient border-0 text-white hover:opacity-90">
                <Link href="/admin/products/new"><Plus className="w-4 h-4 mr-2" /> Add First Product</Link>
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export const dynamic = 'force-dynamic'
