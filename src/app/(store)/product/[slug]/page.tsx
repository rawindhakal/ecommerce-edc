import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import AddToCartButton from './add-to-cart-button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Star, Shield, Leaf, Zap, Package, ChevronRight } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import type { Product } from '@/types/supabase'
import { DEMO_PRODUCTS } from '@/lib/demo-data'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*, category:categories(name, slug), inventory(quantity, low_stock_threshold)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (data) return data as Product
  } catch {}
  // Fallback to demo product
  return DEMO_PRODUCTS.find(p => p.slug === slug) || null
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const images = product.images || []
  const primaryImage = images[0]
  const inventory = (product as any).inventory?.[0]
  const inStock = inventory ? inventory.quantity > 0 : true
  const lowStock = inventory ? inventory.quantity <= inventory.low_stock_threshold && inventory.quantity > 0 : false
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/shop" className="hover:text-primary transition-colors">Shop</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={`/shop?category=${product.category.slug}`} className="hover:text-primary transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-muted">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt || product.name}
                  fill className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-muted-foreground/30" />
                </div>
              )}
              {discount && discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-destructive/90 text-white border-0">-{discount}%</Badge>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer border-2 border-transparent hover:border-primary transition-colors">
                    <Image src={img.url} alt={img.alt || `${product.name} ${i + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {product.category && (
              <p className="text-sm text-primary font-medium tracking-widest uppercase mb-2">{product.category.name}</p>
            )}
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < 4 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">4.8 (127 reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-display text-3xl font-bold">{formatPrice(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
              )}
            </div>

            {/* Loyalty Points */}
            {product.loyalty_points_reward > 0 && (
              <div className="flex items-center gap-2 text-sm text-primary font-medium mb-4">
                <Zap className="w-4 h-4" />
                Earn {product.loyalty_points_reward} loyalty points with this purchase
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {!inStock ? (
                <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
              ) : lowStock ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-sm">Only {inventory?.quantity} left</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800 border-green-200 text-sm">In Stock</Badge>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-muted-foreground leading-relaxed mb-6">{product.short_description}</p>
            )}

            <Separator className="my-6" />

            {/* Add to Cart */}
            <AddToCartButton product={product} inStock={inStock} />

            <Separator className="my-6" />

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Shield, label: 'Dermatologist Tested' },
                { icon: Leaf, label: 'Cruelty-Free' },
                { icon: Package, label: 'Free Returns' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 text-center">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {product.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <div className="grid md:grid-cols-3 gap-6">
            {product.description && (
              <div className="md:col-span-2 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-border">
                <h3 className="font-display font-semibold text-lg mb-3">Description</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
              </div>
            )}
            {(product.how_to_use || product.ingredients) && (
              <div className="space-y-4">
                {product.how_to_use && (
                  <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-border">
                    <h3 className="font-display font-semibold text-base mb-2">How to Use</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{product.how_to_use}</p>
                  </div>
                )}
                {product.ingredients && (
                  <div className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-border">
                    <h3 className="font-display font-semibold text-base mb-2">Key Ingredients</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{product.ingredients}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
