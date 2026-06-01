'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, Star, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/lib/store/cart-context'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Product } from '@/types/supabase'
import { toast } from 'sonner'

interface ProductCardProps {
  product: Product
  className?: string
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { addItem } = useCart()
  const [wishlist, setWishlist] = useState(false)
  const [adding, setAdding] = useState(false)

  const image = product.images?.[0]
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null

  async function handleAddToCart() {
    setAdding(true)
    addItem(product, 1)
    toast.success(`${product.name} added to bag`, {
      description: `${formatPrice(product.price)}`,
      icon: '✦',
    })
    setTimeout(() => setAdding(false), 600)
  }

  return (
    <div className={cn(
      'group relative bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-white/70 shadow-sm hover:shadow-[0_20px_50px_-12px_rgba(236,72,153,0.35)] hover:border-primary/30 transition-all duration-300 hover:-translate-y-1.5',
      className
    )}>
      {/* Image */}
      <Link href={`/product/${product.slug}`} className="block relative aspect-[4/5] overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
            <ShoppingBag className="w-12 h-12 text-primary/30" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_featured && (
            <Badge className="rose-gold-gradient border-0 text-white text-[10px] px-2 py-0.5 font-medium">
              ✦ Featured
            </Badge>
          )}
          {discount && discount > 0 && (
            <Badge className="bg-accent text-white border-0 text-[10px] px-2 py-0.5 font-semibold">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); setWishlist(!wishlist) }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
          aria-label={wishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={cn('w-4 h-4 transition-colors', wishlist ? 'fill-rose-500 text-rose-500' : 'text-foreground/60')} />
        </button>

        {/* Quick Add overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            onClick={(e) => { e.preventDefault(); handleAddToCart() }}
            disabled={adding}
            className="w-full rose-gold-gradient border-0 text-white hover:opacity-90 rounded-xl text-sm cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {adding ? 'Added!' : 'Quick Add'}
          </Button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        {product.category && (
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium mb-1">
            {product.category.name}
          </p>
        )}
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-display font-semibold text-sm leading-snug hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Stars (placeholder) */}
        <div className="flex items-center gap-1 mt-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={cn('w-3 h-3', i < 4 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
          ))}
          <span className="text-[10px] text-muted-foreground ml-0.5">(24)</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{formatPrice(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
            )}
          </div>
          {product.loyalty_points_reward > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-primary font-medium">
              <Zap className="w-3 h-3" />
              {product.loyalty_points_reward} pts
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
