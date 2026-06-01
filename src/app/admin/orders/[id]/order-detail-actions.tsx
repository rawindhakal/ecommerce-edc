'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { printInvoice } from '../print-invoice'
import DeleteOrderDialog from '../delete-order-dialog'
import { Printer, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function OrderDetailActions({ order }: { order: any }) {
  const supabase = createClient()
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function setStatus(status: string | null) {
    if (!status) return
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id)
    if (error) toast.error('Failed to update status')
    else { toast.success(`Status updated to ${status}`); router.refresh() }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={order.status} onValueChange={setStatus}>
        <SelectTrigger className="h-9 w-36 cursor-pointer text-sm capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map(s => (
            <SelectItem key={s} value={s} className="capitalize cursor-pointer">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={() => printInvoice(order)} className="rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer">
        <Printer className="w-4 h-4 mr-2" /> Print Invoice
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setDeleteOpen(true)}
        className="cursor-pointer border-destructive/30 text-destructive hover:bg-destructive/10"
        aria-label="Delete order"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <DeleteOrderDialog
        orderId={order.id}
        orderNumber={order.order_number}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        redirectTo="/admin/orders"
      />
    </div>
  )
}
