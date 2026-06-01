'use client'
import { useCart } from '@/lib/store/cart-context'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatPrice } from '@/lib/utils'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQty, subtotal, itemCount } = useCart()

  return (
    <Sheet open={isOpen} onOpenChange={toggleCart}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <SheetTitle className="font-display text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Your Bag
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({itemCount} items)</span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <div className="w-20 h-20 rose-gold-gradient rounded-full flex items-center justify-center opacity-20">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-foreground">Your bag is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Add some luxurious products to get started</p>
            </div>
            <Button onClick={toggleCart} className="rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer" asChild>
              <Link href="/shop">Explore Products <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {item.product.images?.[0] && (
                        <Image
                          src={item.product.images[0].url}
                          alt={item.product.images[0].alt || item.product.name}
                          fill className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight line-clamp-2">{item.product.name}</p>
                      <p className="text-sm text-primary font-semibold mt-1">{formatPrice(item.product.price)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-border rounded-full">
                          <button
                            onClick={() => updateQty(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQty(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted rounded-full transition-colors cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="px-6 py-4 border-t border-border space-y-4">
              {/* Loyalty points preview */}
              <div className="flex items-center justify-between text-sm bg-primary/5 rounded-xl px-3 py-2">
                <span className="text-muted-foreground">Points you'll earn</span>
                <span className="font-semibold text-primary">
                  +{items.reduce((s, i) => s + (i.product.loyalty_points_reward || 0) * i.quantity, 0)} pts
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold text-lg">{formatPrice(subtotal)}</span>
              </div>

              <p className="text-xs text-muted-foreground">Shipping & taxes calculated at checkout</p>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={toggleCart} asChild>
                  <Link href="/cart">View Cart</Link>
                </Button>
                <Button className="flex-1 rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer" asChild>
                  <Link href="/checkout" onClick={toggleCart}>Checkout <ArrowRight className="ml-1 w-4 h-4" /></Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
