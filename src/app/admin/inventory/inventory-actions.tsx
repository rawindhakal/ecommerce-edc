'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

interface Props {
  inventoryId: string
  productId: string
  productName: string
  currentQty: number
}

export default function InventoryActions({ inventoryId, productId, productName, currentQty }: Props) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<'restock' | 'adjustment' | 'damaged'>('restock')
  const [qty, setQty] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit() {
    const qtyNum = parseInt(qty)
    if (!qtyNum || isNaN(qtyNum)) { toast.error('Enter a valid quantity'); return }
    setLoading(true)

    const isPositive = action === 'restock'
    const change = isPositive ? Math.abs(qtyNum) : -Math.abs(qtyNum)
    const newQty = Math.max(0, currentQty + change)

    try {
      // Update inventory
      const { error: invErr } = await supabase
        .from('inventory').update({ quantity: newQty } as any).eq('id', inventoryId)
      if (invErr) throw invErr

      // Log transaction
      await supabase.from('inventory_transactions').insert({
        product_id: productId, action, notes: notes || null,
        quantity_change: change, quantity_before: currentQty, quantity_after: newQty,
      } as any)

      toast.success(`Inventory updated: ${currentQty} → ${newQty}`)
      setOpen(false); setQty(''); setNotes('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update inventory')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline" size="sm" onClick={() => setOpen(true)}
        className="cursor-pointer text-xs gap-1.5"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Update Stock
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Update Stock</DialogTitle>
            <p className="text-sm text-muted-foreground">{productName}</p>
            <p className="text-sm">Current stock: <strong>{currentQty}</strong></p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Action</Label>
              <Select value={action} onValueChange={v => setAction(v as any)}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock" className="cursor-pointer">Restock (Add)</SelectItem>
                  <SelectItem value="adjustment" className="cursor-pointer">Manual Adjustment</SelectItem>
                  <SelectItem value="damaged" className="cursor-pointer">Damaged / Remove</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input
                type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
                placeholder={`Units to ${action === 'restock' ? 'add' : 'remove'}`}
              />
              {qty && !isNaN(parseInt(qty)) && (
                <p className="text-xs text-muted-foreground">
                  New qty: {Math.max(0, currentQty + (action === 'restock' ? parseInt(qty) : -parseInt(qty)))}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Reason for adjustment..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} className="rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer">
              {loading ? 'Saving...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
