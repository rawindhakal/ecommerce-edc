'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Settings2 } from 'lucide-react'

export default function LoyaltyPointsAdjuster({ customerId, customerName, currentPoints }: {
  customerId: string; customerName: string; currentPoints: number
}) {
  const [open, setOpen] = useState(false)
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleAdjust() {
    const pts = parseInt(points)
    if (isNaN(pts) || pts === 0) { toast.error('Enter valid points amount'); return }
    setLoading(true)
    try {
      const newBalance = Math.max(0, currentPoints + pts)
      await supabase.from('profiles').update({ loyalty_points: newBalance }).eq('id', customerId)
      await supabase.from('loyalty_transactions').insert({
        customer_id: customerId, type: 'adjust',
        points: pts, balance_after: newBalance,
        description: reason || `Admin adjustment by ${pts > 0 ? '+' : ''}${pts} points`,
      })
      toast.success(`Points adjusted: ${currentPoints} → ${newBalance}`)
      setOpen(false); setPoints(''); setReason('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="w-7 h-7 cursor-pointer" onClick={() => setOpen(true)} aria-label="Adjust points">
        <Settings2 className="w-3.5 h-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Adjust Points</DialogTitle>
            <p className="text-sm text-muted-foreground">{customerName} · Current: {currentPoints} pts</p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Points adjustment (+ to add, - to deduct)</Label>
              <Input type="number" value={points} onChange={e => setPoints(e.target.value)} placeholder="+100 or -50" />
              {points && !isNaN(parseInt(points)) && (
                <p className="text-xs text-muted-foreground">New balance: {Math.max(0, currentPoints + parseInt(points))}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Birthday bonus, correction..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleAdjust} disabled={loading} className="rose-gold-gradient border-0 text-white cursor-pointer">
              {loading ? 'Saving...' : 'Apply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
