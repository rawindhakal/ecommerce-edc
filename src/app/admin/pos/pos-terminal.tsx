'use client'
import { useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatPrice, formatPriceCompact } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Search, Plus, Minus, Trash2, ShoppingBag, Package, Check,
  Printer, RotateCcw, Zap, User, X, UserPlus, ChevronRight,
  Banknote, CreditCard, Smartphone, Building2, Split
} from 'lucide-react'
import type { Product } from '@/types/supabase'
import { useStoreConfig } from '@/lib/store/store-config-context'

/* ─── Types ─── */
interface POSItem { product: Product; quantity: number; price: number }
interface CustomerResult { id: string; full_name: string | null; email: string; phone: string | null; loyalty_points: number; loyalty_tier: string; customer_code: string | null; total_spent: number }

type PaymentMethodKey = 'cash' | 'card' | 'esewa' | 'fonepay' | 'bank_transfer'
interface SplitEntry { method: PaymentMethodKey; amount: string; reference: string }

const PAYMENT_METHODS: { key: PaymentMethodKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'cash',          label: 'Cash',          icon: Banknote,    color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'esewa',         label: 'eSewa',          icon: Smartphone,  color: 'bg-green-100 text-green-700 border-green-200' },
  { key: 'fonepay',       label: 'FonePay',        icon: Smartphone,  color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'card',          label: 'Card',           icon: CreditCard,  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'bank_transfer', label: 'Bank Transfer',  icon: Building2,   color: 'bg-amber-100 text-amber-700 border-amber-200' },
]

const TAX_RATE = 0.13 // 13% VAT Nepal

export default function POSTerminal({ products }: { products: Product[] }) {
  const supabase = createClient()
  const { storeName } = useStoreConfig()

  /* ─── Cart ─── */
  const [cart, setCart] = useState<POSItem[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  /* ─── Customer ─── */
  const [customer, setCustomer] = useState<CustomerResult | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [redeemPoints, setRedeemPoints] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })
  const [addingCustomer, setAddingCustomer] = useState(false)

  /* ─── Payment ─── */
  const [splitMode, setSplitMode] = useState(false)
  const [singleMethod, setSingleMethod] = useState<PaymentMethodKey>('cash')
  const [singleRef, setSingleRef] = useState('')
  const [splits, setSplits] = useState<SplitEntry[]>([
    { method: 'cash', amount: '', reference: '' }
  ])
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat')
  const [loading, setLoading] = useState(false)

  /* ─── Receipt ─── */
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState<any>(null)
  const receiptRef = useRef<HTMLDivElement>(null)

  /* ─── Derived ─── */
  const categories = useMemo(() => {
    const m = new Map<string, string>()
    products.forEach(p => { if ((p as any).category) m.set((p as any).category.slug, (p as any).category.name) })
    return Array.from(m.entries()).map(([slug, name]) => ({ slug, name }))
  }, [products])

  const filtered = useMemo(() =>
    products.filter(p => {
      const matchS = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || '').toLowerCase().includes(search.toLowerCase())
      const matchC = !activeCategory || (p as any).category?.slug === activeCategory
      return matchS && matchC
    }), [products, search, activeCategory])

  /* ─── Cart ops ─── */
  function addItem(product: Product) {
    setCart(prev => {
      const idx = prev.findIndex(i => i.product.id === product.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], quantity: n[idx].quantity + 1 }; return n }
      return [...prev, { product, quantity: 1, price: product.price }]
    })
  }
  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(i => i.product.id === id ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0))
  }
  function removeItem(id: string) { setCart(prev => prev.filter(i => i.product.id !== id)) }

  /* ─── Totals ─── */
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const discountRaw = parseFloat(discount) || 0
  const discountAmt = discountType === 'percent'
    ? Math.min(subtotal * (discountRaw / 100), subtotal)
    : discountRaw
  const LOYALTY_RATE = 0.01
  const loyaltyDiscount = redeemPoints && customer ? Math.min(customer.loyalty_points * LOYALTY_RATE, subtotal * 0.3) : 0
  const afterDiscount = Math.max(0, subtotal - discountAmt - loyaltyDiscount)
  const taxAmt = afterDiscount * TAX_RATE
  const total = afterDiscount + taxAmt
  const pointsEarned = customer ? cart.reduce((s, i) => s + (i.product.loyalty_points_reward || 0) * i.quantity, 0) : 0
  const pointsUsed = redeemPoints && customer ? Math.ceil(loyaltyDiscount / LOYALTY_RATE) : 0

  /* ─── Split totals ─── */
  const splitTotal = splits.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const splitRemaining = Math.max(0, total - splitTotal)

  function addSplit() { setSplits(s => [...s, { method: 'cash', amount: '', reference: '' }]) }
  function removeSplit(i: number) { setSplits(s => s.filter((_, idx) => idx !== i)) }
  function updateSplit(i: number, field: keyof SplitEntry, val: string) {
    setSplits(s => s.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
  }
  function autoFillSplit(i: number) {
    const alreadyPaid = splits.reduce((s, e, idx) => idx === i ? s : s + (parseFloat(e.amount) || 0), 0)
    const rem = Math.max(0, total - alreadyPaid)
    updateSplit(i, 'amount', rem.toFixed(2))
  }

  /* ─── Customer lookup ─── */
  async function lookupCustomer() {
    const q = customerSearch.trim()
    if (!q) return
    const { data } = await supabase
      .from('profiles')
      .select('id,full_name,email,phone,loyalty_points,loyalty_tier,customer_code,total_spent')
      .or(`email.ilike.%${q}%,phone.eq.${q},customer_code.eq.${q}`)
      .eq('role', 'customer')
      .limit(1)
      .maybeSingle()
    if (data) {
      setCustomer(data as CustomerResult)
      toast.success(`Customer: ${data.full_name || data.email}`)
    } else {
      toast.error('Customer not found')
      setShowAddCustomer(true)
      setNewCustomer(p => ({
        ...p,
        phone: /^\d{6,}$/.test(q) ? q : p.phone,
        email: q.includes('@') ? q : p.email,
      }))
    }
  }

  /* ─── Add new customer from POS ─── */
  async function handleAddCustomer() {
    if (!newCustomer.name && !newCustomer.phone) { toast.error('Name or phone required'); return }
    setAddingCustomer(true)
    try {
      const res = await fetch('/api/admin/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustomer.name,
          phone: newCustomer.phone,
          email: newCustomer.email || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create customer')
      setCustomer(json.customer as CustomerResult)
      toast.success(`Customer added! Code: #${json.customer.customer_code || '—'}`)
      setShowAddCustomer(false)
      setNewCustomer({ name: '', phone: '', email: '' })
      setCustomerSearch('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to add customer')
    } finally {
      setAddingCustomer(false)
    }
  }

  /* ─── Process payment ─── */
  async function processPayment() {
    if (cart.length === 0) { toast.error('Cart is empty'); return }

    const paymentEntries: { method: string; amount: number; reference: string }[] = splitMode
      ? splits.filter(s => parseFloat(s.amount) > 0).map(s => ({ method: s.method, amount: parseFloat(s.amount), reference: s.reference }))
      : [{ method: singleMethod, amount: total, reference: singleRef }]

    if (splitMode) {
      const paid = paymentEntries.reduce((s, e) => s + e.amount, 0)
      if (Math.abs(paid - total) > 1) { toast.error(`Split total Rs. ${formatPriceCompact(paid)} doesn't match order total ${formatPrice(total)}`); return }
    }

    setLoading(true)
    try {
      const { data: order, error: orderErr } = await supabase.from('orders').insert({
        customer_id: customer?.id || null,
        status: 'delivered',
        subtotal,
        discount_amount: discountAmt + loyaltyDiscount,
        tax_amount: taxAmt,
        total,
        payment_method: splitMode
          // use the method with the highest amount in split
          ? (splits.reduce((a, b) => (parseFloat(b.amount) || 0) > (parseFloat(a.amount) || 0) ? b : a, splits[0])?.method || 'cash')
          : singleMethod,
        payment_status: 'paid',
        loyalty_points_used: pointsUsed,
        loyalty_points_earned: pointsEarned,
        is_pos_order: true,
        split_payments: paymentEntries,
        notes: splitMode ? `Split: ${paymentEntries.map(e => `${e.method}=${formatPrice(e.amount)}`).join(', ')}` : undefined,
      } as any).select().single()
      if (orderErr) throw orderErr

      await supabase.from('order_items').insert(
        cart.map(item => ({
          order_id: order.id, product_id: item.product.id,
          product_name: item.product.name, sku: item.product.sku,
          quantity: item.quantity, unit_price: item.price,
          total: item.price * item.quantity,
        }))
      )

      // Update inventory
      for (const item of cart) {
        const { data: inv } = await supabase.from('inventory').select('id,quantity').eq('product_id', item.product.id).single()
        if (inv) {
          const newQty = Math.max(0, inv.quantity - item.quantity)
          await supabase.from('inventory').update({ quantity: newQty } as any).eq('id', inv.id)
          await supabase.from('inventory_transactions').insert({
            product_id: item.product.id, action: 'sale',
            quantity_change: -item.quantity, quantity_before: inv.quantity, quantity_after: newQty,
            reference_id: order.id,
          } as any)
        }
      }

      // Loyalty
      if (customer) {
        const netPts = pointsEarned - pointsUsed
        const newBalance = Math.max(0, customer.loyalty_points + netPts)
        await supabase.from('profiles').update({
          loyalty_points: newBalance,
          total_spent: (customer.total_spent || 0) + total,
        } as any).eq('id', customer.id)
        if (pointsEarned > 0) await supabase.from('loyalty_transactions').insert({ customer_id: customer.id, order_id: order.id, type: 'earn', points: pointsEarned, balance_after: newBalance, description: `POS order ${order.order_number}` } as any)
        if (pointsUsed > 0) await supabase.from('loyalty_transactions').insert({ customer_id: customer.id, order_id: order.id, type: 'redeem', points: -pointsUsed, balance_after: newBalance - pointsEarned, description: 'Points redeemed at POS' } as any)
      }

      const discountLabel = discountType === 'percent' && discountRaw > 0 ? `(${discountRaw}%)` : ''
      setLastOrder({ ...order, items: cart, customer, paymentEntries, taxAmt, discountAmt, discountLabel, loyaltyDiscount, pointsEarned, pointsUsed })
      setReceiptOpen(true)
      setCart([]); setCustomer(null); setCustomerSearch(''); setDiscount(''); setDiscountType('flat'); setSingleRef(''); setRedeemPoints(false)
      setSplits([{ method: 'cash', amount: '', reference: '' }]); setSplitMode(false)
      toast.success('Payment processed!')
    } catch (err: any) {
      toast.error(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  /* ─── Thermal print ─── */
  function handlePrint() {
    const printContent = receiptRef.current
    if (!printContent) return
    const win = window.open('', '_blank', 'width=380,height=600')
    if (!win) return
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>
        @page { margin: 0; size: 80mm auto; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 11px; width: 80mm; padding: 4mm; background: white; color: black; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 14px; }
        .separator { border-top: 1px dashed #000; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; }
        .total-row { font-size: 13px; font-weight: bold; }
        .small { font-size: 10px; }
        .mt4 { margin-top: 4px; }
        .mt8 { margin-top: 8px; }
        .mb4 { margin-bottom: 4px; }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  return (
    <div className="flex flex-col gap-4 lg:h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <h1 className="font-display text-xl sm:text-2xl font-bold">POS Terminal</h1>
        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Active
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 gap-4 lg:min-h-0">
        {/* ── LEFT: Product panel ── */}
        <div className="flex-1 flex flex-col min-w-0 gap-3">
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or scan barcode…" className="pl-10 bg-white/80" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"><X className="w-4 h-4 text-muted-foreground" /></button>}
          </div>
          <div className="flex gap-2 flex-wrap flex-shrink-0">
            <Badge variant={!activeCategory ? 'default' : 'outline'} className="cursor-pointer px-3 py-1" onClick={() => setActiveCategory(null)}>All</Badge>
            {categories.map(c => (
              <Badge key={c.slug} variant={activeCategory === c.slug ? 'default' : 'outline'} className="cursor-pointer px-3 py-1" onClick={() => setActiveCategory(activeCategory === c.slug ? null : c.slug)}>{c.name}</Badge>
            ))}
          </div>
          <div className="lg:flex-1 lg:overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
              {filtered.map(product => {
                const inv = (product as any).inventory?.[0]
                const inCart = cart.find(i => i.product.id === product.id)
                return (
                  <button key={product.id} onClick={() => addItem(product)} disabled={inv?.quantity === 0}
                    className="relative text-left p-3 bg-white/80 rounded-xl border-2 border-transparent hover:border-primary transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                      {product.images?.[0] ? <Image src={product.images[0].url} alt={product.name} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-muted-foreground/30" /></div>}
                    </div>
                    {inCart && <div className="absolute top-2 right-2 w-5 h-5 rose-gold-gradient rounded-full flex items-center justify-center text-white text-[10px] font-bold">{inCart.quantity}</div>}
                    <p className="text-xs font-semibold line-clamp-2 leading-tight mb-0.5">{product.name}</p>
                    <p className="font-bold text-sm text-primary">{formatPrice(product.price)}</p>
                    {inv && <p className="text-[10px] text-muted-foreground">{inv.quantity} stock</p>}
                  </button>
                )
              })}
              {filtered.length === 0 && <div className="col-span-4 py-12 text-center text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No products</p></div>}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Cart & payment panel ── */}
        <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm lg:flex-shrink-0">

          {/* Customer section */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupCustomer()}
                  placeholder="Name / Phone / Code" className="pl-8 h-8 text-xs" />
              </div>
              <Button size="sm" variant="outline" onClick={lookupCustomer} className="h-8 cursor-pointer text-xs px-2">Find</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddCustomer(true)} className="h-8 cursor-pointer text-xs px-2" title="Add new customer">
                <UserPlus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {customer ? (
              <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-semibold">{customer.full_name || customer.email}</p>
                  <p className="text-[10px] text-muted-foreground">#{customer.customer_code || '—'} · {customer.loyalty_tier} · {customer.loyalty_points} pts</p>
                  {customer.phone && <p className="text-[10px] text-muted-foreground">{customer.phone}</p>}
                </div>
                <button onClick={() => { setCustomer(null); setRedeemPoints(false) }} className="cursor-pointer text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : null}
          </div>

          {/* Cart items */}
          <div className="max-h-72 lg:max-h-none lg:flex-1 overflow-y-auto p-3 space-y-2.5">
            {cart.length === 0
              ? <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-6"><ShoppingBag className="w-10 h-10 mb-2 opacity-20" /><p className="text-sm">Cart empty</p><p className="text-xs">Tap products to add</p></div>
              : cart.map(item => (
                <div key={item.product.id} className="flex items-start gap-2 pb-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold line-clamp-1">{item.product.name}</p>
                    <p className="text-[11px] text-primary font-medium">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateQty(item.product.id, -1)} className="w-5 h-5 flex items-center justify-center border border-border rounded-full hover:bg-muted cursor-pointer"><Minus className="w-2.5 h-2.5" /></button>
                    <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="w-5 h-5 flex items-center justify-center border border-border rounded-full hover:bg-muted cursor-pointer"><Plus className="w-2.5 h-2.5" /></button>
                    <button onClick={() => removeItem(item.product.id)} className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-destructive cursor-pointer ml-1"><Trash2 className="w-2.5 h-2.5" /></button>
                  </div>
                  <p className="text-xs font-bold shrink-0 w-16 text-right">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
          </div>

          {/* Order summary & payment */}
          <div className="p-3 border-t border-border space-y-2.5">
            {/* Discount + Loyalty */}
            <div className="flex gap-2">
              <div className="flex flex-1 rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => { setDiscountType('flat'); setDiscount('') }}
                  className={`px-2 h-8 text-xs font-medium transition-colors cursor-pointer ${discountType === 'flat' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                  title="Fixed amount discount"
                >
                  Rs.
                </button>
                <Input
                  type="number" min="0"
                  max={discountType === 'percent' ? 100 : undefined}
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  placeholder={discountType === 'percent' ? '0–100 %' : 'Amount'}
                  className="h-8 text-xs flex-1 border-0 rounded-none focus:ring-0"
                />
                <button
                  onClick={() => { setDiscountType('percent'); setDiscount('') }}
                  className={`px-2 h-8 text-xs font-medium transition-colors cursor-pointer ${discountType === 'percent' ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                  title="Percentage discount"
                >
                  %
                </button>
              </div>
              {customer && customer.loyalty_points > 0 && (
                <button onClick={() => setRedeemPoints(!redeemPoints)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer shrink-0 ${redeemPoints ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary'}`}>
                  <Zap className="w-3 h-3" />{redeemPoints ? 'On' : 'Pts'}
                </button>
              )}
            </div>

            {/* Totals */}
            <div className="bg-muted/30 rounded-xl px-3 py-2 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount{discountType === 'percent' && discountRaw > 0 ? ` (${discountRaw}%)` : ''}</span>
                  <span>-{formatPrice(discountAmt)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && <div className="flex justify-between text-primary"><span>Points ({pointsUsed} pts)</span><span>-{formatPrice(loyaltyDiscount)}</span></div>}
              <div className="flex justify-between text-muted-foreground"><span>VAT (13%)</span><span>{formatPrice(taxAmt)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span className="rose-gold-text">{formatPrice(total)}</span></div>
            </div>

            {/* Payment method toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Payment</span>
              <button
                onClick={() => setSplitMode(!splitMode)}
                className={`ml-auto flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors cursor-pointer ${splitMode ? 'bg-primary text-white border-primary' : 'border-border hover:border-primary'}`}
              >
                <Split className="w-3 h-3" /> Split
              </button>
            </div>

            {/* Single payment */}
            {!splitMode ? (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  {PAYMENT_METHODS.map(pm => (
                    <button key={pm.key} onClick={() => setSingleMethod(pm.key)}
                      className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border text-[10px] font-medium transition-colors cursor-pointer ${singleMethod === pm.key ? 'rose-gold-gradient text-white border-transparent' : 'border-border hover:border-primary bg-white'}`}>
                      <pm.icon className="w-3.5 h-3.5" />
                      {pm.label}
                    </button>
                  ))}
                </div>
                {singleMethod !== 'cash' && (
                  <Input value={singleRef} onChange={e => setSingleRef(e.target.value)} placeholder={`${PAYMENT_METHODS.find(m => m.key === singleMethod)?.label} reference / txn ID`} className="h-8 text-xs" />
                )}
                {singleMethod === 'cash' && (
                  <div className="text-xs text-muted-foreground text-center">Collect {formatPrice(total)} cash</div>
                )}
              </div>
            ) : (
              /* Split payment */
              <div className="space-y-2">
                {splits.map((split, i) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <select value={split.method} onChange={e => updateSplit(i, 'method', e.target.value as PaymentMethodKey)} className="flex-1 text-xs border border-border rounded-lg px-2 py-1 bg-white cursor-pointer">
                        {PAYMENT_METHODS.map(pm => <option key={pm.key} value={pm.key}>{pm.label}</option>)}
                      </select>
                      <div className="flex items-center gap-1 flex-1">
                        <Input value={split.amount} onChange={e => updateSplit(i, 'amount', e.target.value)} placeholder="Amount" type="number" className="h-7 text-xs" />
                        <button onClick={() => autoFillSplit(i)} className="text-[10px] text-primary whitespace-nowrap cursor-pointer hover:underline">Rem</button>
                      </div>
                      {splits.length > 1 && <button onClick={() => removeSplit(i)} className="cursor-pointer text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                    {split.method !== 'cash' && <Input value={split.reference} onChange={e => updateSplit(i, 'reference', e.target.value)} placeholder="Reference / txn ID" className="h-7 text-xs" />}
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs">
                  <button onClick={addSplit} className="flex items-center gap-1 text-primary hover:underline cursor-pointer font-medium"><Plus className="w-3 h-3" />Add method</button>
                  <div className={`font-semibold ${splitRemaining > 0.5 ? 'text-red-500' : 'text-green-600'}`}>
                    {splitRemaining > 0.5 ? `Remaining: ${formatPrice(splitRemaining)}` : '✓ Fully paid'}
                  </div>
                </div>
              </div>
            )}

            {customer && pointsEarned > 0 && (
              <p className="text-[10px] text-primary text-center flex items-center justify-center gap-1"><Zap className="w-3 h-3" />+{pointsEarned} points for {customer.full_name || 'customer'}</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 cursor-pointer" onClick={() => setCart([])} disabled={!cart.length}><RotateCcw className="w-3.5 h-3.5 mr-1" />Clear</Button>
              <Button size="sm" onClick={processPayment} disabled={loading || !cart.length || (splitMode && splitRemaining > 0.5)}
                className="flex-1 rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-3.5 h-3.5 mr-1" />{formatPrice(total)}</>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" />Add New Customer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={newCustomer.name} onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))} placeholder="Customer name" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} placeholder="98XXXXXXXX" type="tel" />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} placeholder="customer@email.com" type="email" />
            </div>
            <p className="text-xs text-muted-foreground">A unique 4-digit customer code will be auto-generated.</p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setShowAddCustomer(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} disabled={addingCustomer} className="flex-1 rose-gold-gradient border-0 text-white cursor-pointer">
              {addingCustomer ? 'Adding…' : 'Add Customer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="font-display text-center">Payment Complete</DialogTitle></DialogHeader>
          {lastOrder && (
            <div className="space-y-3">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-bold text-xl">{formatPrice(lastOrder.total)}</p>
                <p className="text-xs text-muted-foreground">{lastOrder.order_number}</p>
              </div>

              {/* Thermal receipt preview */}
              <div ref={receiptRef} className="bg-white border border-border rounded-lg p-3 text-xs font-mono">
                <div className="center bold large mb4">{storeName}</div>
                <div className="center small mb4">Beauty & Cosmetics Store</div>
                <div className="separator" />
                <div className="row small"><span>Order:</span><span>{lastOrder.order_number}</span></div>
                <div className="row small"><span>Date:</span><span>{new Date().toLocaleDateString('en-US')}</span></div>
                <div className="row small"><span>Time:</span><span>{new Date().toLocaleTimeString('en-US')}</span></div>
                {lastOrder.customer && (
                  <div className="row small"><span>Customer:</span><span>{lastOrder.customer.full_name || lastOrder.customer.email}</span></div>
                )}
                {lastOrder.customer?.customer_code && (
                  <div className="row small"><span>Code:</span><span>#{lastOrder.customer.customer_code}</span></div>
                )}
                <div className="separator" />
                {lastOrder.items.map((item: POSItem) => (
                  <div key={item.product.id}>
                    <div className="small">{item.product.name}</div>
                    <div className="row small">
                      <span>{item.quantity} x {formatPrice(item.price)}</span>
                      <span className="bold">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                ))}
                <div className="separator" />
                <div className="row small"><span>Subtotal</span><span>{formatPrice(lastOrder.subtotal)}</span></div>
                {lastOrder.discountAmt > 0 && <div className="row small"><span>Discount{lastOrder.discountLabel ? ` ${lastOrder.discountLabel}` : ''}</span><span>-{formatPrice(lastOrder.discountAmt)}</span></div>}
                {lastOrder.loyaltyDiscount > 0 && <div className="row small"><span>Points</span><span>-{formatPrice(lastOrder.loyaltyDiscount)}</span></div>}
                <div className="row small"><span>VAT 13%</span><span>{formatPrice(lastOrder.taxAmt)}</span></div>
                <div className="separator" />
                <div className="row total-row"><span>TOTAL</span><span>{formatPrice(lastOrder.total)}</span></div>
                <div className="separator" />
                {lastOrder.paymentEntries.map((p: any, i: number) => (
                  <div key={i} className="row small">
                    <span>{PAYMENT_METHODS.find(m => m.key === p.method)?.label || p.method}</span>
                    <span>{formatPrice(p.amount)}{p.reference ? ` (${p.reference})` : ''}</span>
                  </div>
                ))}
                {lastOrder.pointsEarned > 0 && (
                  <>
                    <div className="separator" />
                    <div className="row small"><span>Points Earned</span><span>+{lastOrder.pointsEarned} pts</span></div>
                    {lastOrder.customer && <div className="row small"><span>Balance</span><span>{(lastOrder.customer.loyalty_points + lastOrder.pointsEarned - lastOrder.pointsUsed).toLocaleString()} pts</span></div>}
                  </>
                )}
                <div className="separator" />
                <div className="center small mt4">Thank you for your purchase!</div>
                <div className="center small">Visit us again at {storeName}</div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 cursor-pointer" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-1.5" />Print
                </Button>
                <Button size="sm" className="flex-1 rose-gold-gradient border-0 text-white cursor-pointer" onClick={() => setReceiptOpen(false)}>
                  New Sale
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
