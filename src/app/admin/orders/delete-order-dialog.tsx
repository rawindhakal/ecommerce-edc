'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ORDER_DELETE_PIN } from '@/lib/store-config'
import { Trash2, ShieldAlert, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  orderId: string
  orderNumber: string
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Where to go after a successful delete. Defaults to refreshing in place. */
  redirectTo?: string
}

export default function DeleteOrderDialog({ orderId, orderNumber, open, onOpenChange, redirectTo }: Props) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleDelete() {
    if (pin !== ORDER_DELETE_PIN) {
      setError('Incorrect PIN. Deletion not authorized.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, pin }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete order')

      toast.success(`Order ${orderNumber} deleted`)
      onOpenChange(false)
      setPin('')
      if (redirectTo) router.push(redirectTo)
      else router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to delete order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setPin(''); setError('') } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-destructive">
            <ShieldAlert className="w-5 h-5" /> Delete Order
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-sm text-destructive">
            This permanently deletes <strong>{orderNumber}</strong> and all its line items. This cannot be undone.
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="del-pin">Enter Manager PIN to confirm</Label>
            <Input
              id="del-pin"
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={e => { setPin(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleDelete()}
              placeholder="••••••"
              className="text-center tracking-[0.4em] text-lg font-mono"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={handleDelete}
              disabled={loading || !pin}
              className="flex-1 bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-1.5" /> Delete</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
