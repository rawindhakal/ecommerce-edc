'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/lib/store/cart-context'
import { ShoppingBag, Heart, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types/supabase'

export default function AddToCartButton({ product, inStock }: { product: Product; inStock: boolean }) {
  const [qty, setQty] = useState(1)
  const [wishlist, setWishlist] = useState(false)
  const { addItem } = useCart()

  function handleAdd() {
    addItem(product, qty)
    toast.success(`${product.name} added to bag`, {
      description: `${qty}× ${formatPrice(product.price)}`,
      icon: '✦',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">Quantity</span>
        <div className="flex items-center border border-border rounded-full overflow-hidden">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
            aria-label="Decrease"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-semibold">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
            aria-label="Increase"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleAdd}
          disabled={!inStock}
          size="lg"
          className="flex-1 rose-gold-gradient border-0 text-white hover:opacity-90 shadow-lg shadow-primary/20 cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          {inStock ? 'Add to Bag' : 'Out of Stock'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="px-4 cursor-pointer"
          onClick={() => {
            setWishlist(!wishlist)
            toast.success(wishlist ? 'Removed from wishlist' : 'Added to wishlist')
          }}
          aria-label="Wishlist"
        >
          <Heart className={`w-5 h-5 transition-colors ${wishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
        </Button>
      </div>
    </div>
  )
}
