import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/store/product-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { SlidersHorizontal } from 'lucide-react'
import type { Product, Category } from '@/types/supabase'
import SortSelect from './sort-select'
import BrandName from '@/components/brand-name'
import { DEMO_CATEGORIES, getDemoProducts } from '@/lib/demo-data'

interface ShopPageProps {
  searchParams: Promise<{ category?: string; sort?: string; featured?: string; search?: string }>
}

function sortDemo(list: Product[], sort?: string): Product[] {
  const arr = [...list]
  if (sort === 'price_asc') arr.sort((a, b) => a.price - b.price)
  else if (sort === 'price_desc') arr.sort((a, b) => b.price - a.price)
  else arr.sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
  return arr
}

async function getProducts(params: { category?: string; sort?: string; featured?: string; search?: string }): Promise<Product[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('products')
      .select('*, category:categories!inner(name, slug), inventory(quantity)')
      .eq('is_active', true)

    if (params.category) query = query.eq('categories.slug', params.category)
    if (params.featured === 'true') query = query.eq('is_featured', true)
    if (params.search) query = query.ilike('name', `%${params.search}%`)

    if (params.sort === 'price_asc') query = query.order('price', { ascending: true })
    else if (params.sort === 'price_desc') query = query.order('price', { ascending: false })
    else if (params.sort === 'newest') query = query.order('created_at', { ascending: false })
    else query = query.order('is_featured', { ascending: false })

    const { data } = await query.limit(48)
    if (data && data.length > 0) return data as Product[]
  } catch {}

  // Fallback to demo data
  let demo = getDemoProducts({
    featured: params.featured === 'true',
    category: params.category,
  })
  if (params.search) demo = demo.filter(p => p.name.toLowerCase().includes(params.search!.toLowerCase()))
  return sortDemo(demo, params.sort)
}

async function getCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('display_order')
    if (data && data.length > 0) return data
  } catch {}
  return DEMO_CATEGORIES
}


export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const [products, categories] = await Promise.all([getProducts(params), getCategories()])

  const title = params.category
    ? categories.find(c => c.slug === params.category)?.name || 'Products'
    : params.featured === 'true' ? 'Featured Collection'
    : 'All Products'

  return (
    <div className="min-h-screen pt-20 luxury-gradient">
      {/* Header */}
      <div className="relative py-16 px-4 sm:px-6 text-center overflow-hidden mesh-hero">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="relative max-w-7xl mx-auto">
          <p className="text-sm text-primary font-semibold tracking-[0.2em] uppercase mb-3"><BrandName /> Boutique</p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mb-3 rose-gold-text">{title}</h1>
          <p className="text-muted-foreground">{products.length} {products.length === 1 ? 'product' : 'products'} to discover</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <Link href="/shop">
              <Badge
                variant={!params.category && !params.featured ? 'default' : 'outline'}
                className="cursor-pointer px-4 py-1.5 text-sm transition-colors"
              >
                All
              </Badge>
            </Link>
            {categories.map(cat => (
              <Link key={cat.id} href={`/shop?category=${cat.slug}`}>
                <Badge
                  variant={params.category === cat.slug ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-1.5 text-sm transition-colors"
                >
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Suspense>
              <SortSelect current={params.sort} />
            </Suspense>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rose-gold-gradient rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
              <SlidersHorizontal className="w-12 h-12 text-white" />
            </div>
            <h3 className="font-display text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or browse all products</p>
            <Button asChild className="cursor-pointer">
              <Link href="/shop">Browse All Products</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export const dynamic = 'force-dynamic'
