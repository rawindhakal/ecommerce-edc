'use client'
import { useState } from 'react'
import { MoreHorizontal, Eye, ScanEye, Printer, CheckCircle2, XCircle, Truck, PackageCheck, RefreshCw, Trash2 } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatDateTime, getStatusColor } from '@/lib/utils'
import { printInvoice } from './print-invoice'
import DeleteOrderDialog from './delete-order-dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const STATUS_FLOW: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'confirmed',  label: 'Mark Confirmed',  icon: CheckCircle2 },
  { value: 'processing', label: 'Mark Processing', icon: RefreshCw },
  { value: 'shipped',    label: 'Mark Shipped',    icon: Truck },
  { value: 'delivered',  label: 'Mark Delivered',  icon: PackageCheck },
]

export default function OrderActions({ order }: { order: any }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function setStatus(status: string) {
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id)
    if (error) toast.error('Failed to update status')
    else { toast.success(`Order marked ${status}`); router.refresh() }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-background hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors cursor-pointer"
          aria-label="Order actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2.5 pt-1.5 pb-1 text-xs font-mono font-semibold text-muted-foreground">
            {order.order_number}
          </div>
          <DropdownMenuItem onClick={() => router.push(`/admin/orders/${order.id}`)}>
            <Eye className="w-4 h-4" /> View Full Page
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDetailOpen(true)}>
            <ScanEye className="w-4 h-4" /> Quick Preview
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => printInvoice(order)}>
            <Printer className="w-4 h-4" /> Print Invoice
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Update Status</div>
          {STATUS_FLOW.filter(s => s.value !== order.status).map(s => (
            <DropdownMenuItem key={s.value} onClick={() => setStatus(s.value)}>
              <s.icon className="w-4 h-4" /> {s.label}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />
          {order.status !== 'cancelled' && (
            <DropdownMenuItem variant="destructive" onClick={() => setStatus('cancelled')}>
              <XCircle className="w-4 h-4" /> Cancel Order
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" /> Delete Order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteOrderDialog
        orderId={order.id}
        orderNumber={order.order_number}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      {/* Detail modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              Order {order.order_number}
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium">{order.customer?.full_name || 'Guest'}</p>
                <p className="text-xs text-muted-foreground">{order.customer?.email || ''}</p>
                {order.customer?.phone && <p className="text-xs text-muted-foreground">{order.customer.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{formatDateTime(order.created_at)}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{(order.payment_method || '').replace('_', ' ')} · {order.payment_status}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              {(order.items || []).map((it: any) => (
                <div key={it.id} className="flex justify-between gap-3">
                  <span className="text-foreground/80">{it.product_name} <span className="text-muted-foreground">×{it.quantity}</span></span>
                  <span className="font-medium tabular-nums">{formatPrice(it.total)}</span>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && (
                <p className="text-muted-foreground text-center py-2">No line items recorded</p>
              )}
            </div>

            <Separator />

            <div className="space-y-1.5">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(order.subtotal || 0)}</span></div>
              {order.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount_amount)}</span></div>}
              <div className="flex justify-between text-muted-foreground"><span>VAT</span><span>{formatPrice(order.tax_amount || 0)}</span></div>
              <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span className="rose-gold-text">{formatPrice(order.total)}</span></div>
            </div>

            <button
              onClick={() => printInvoice(order)}
              className="w-full flex items-center justify-center gap-2 rose-gold-gradient text-white rounded-lg py-2.5 font-medium cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
