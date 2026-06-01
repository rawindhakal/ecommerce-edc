'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Settings2 } from 'lucide-react'

export default function LoyaltyAdjustClient({ customerId, customerName, currentPoints }: {
  customerId: string; customerName: string; currentPoints: number
}) {
  const [pts, setPts] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleAdjust() {
    const n = parseInt(pts)
    if (isNaN(n) || n === 0) { toast.error('Enter a valid number'); return }
    setLoading(true)
    try {
      const newBal = Math.max(0, currentPoints + n)
      await supabase.from('profiles').update({ loyalty_points: newBal } as any).eq('id', customerId)
      await supabase.from('loyalty_transactions').insert({
        customer_id: customerId, type: 'adjust', points: n,
        balance_after: newBal, description: reason || `Admin: ${n > 0 ? '+' : ''}${n} pts`,
      } as any)
      toast.success(`Points: ${currentPoints} → ${newBal}`)
      setShow(false); setPts(''); setReason('')
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" className="w-full cursor-pointer text-xs" onClick={() => setShow(!show)}>
        <Settings2 className="w-3.5 h-3.5 mr-1.5" />{show ? 'Cancel' : 'Adjust Points'}
      </Button>
      {show && (
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
          <div className="space-y-1">
            <Label className="text-xs">Points (+/−)</Label>
            <Input type="number" value={pts} onChange={e => setPts(e.target.value)} placeholder="+100 or -50" className="h-8 text-xs" />
            {pts && !isNaN(parseInt(pts)) && (
              <p className="text-xs text-muted-foreground">New: {Math.max(0, currentPoints + parseInt(pts))}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Reason</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Correction, bonus…" className="h-8 text-xs" />
          </div>
          <Button onClick={handleAdjust} disabled={loading} size="sm" className="w-full rose-gold-gradient border-0 text-white cursor-pointer text-xs">
            {loading ? 'Saving…' : 'Apply Adjustment'}
          </Button>
        </div>
      )}
    </div>
  )
}
