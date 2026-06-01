'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Plus, Tag } from 'lucide-react'

export default function CouponForm() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ code: '', description: '', discount_type: 'percent', discount_value: '', minimum_order: '', usage_limit: '', valid_until: '' })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleCreate() {
    if (!form.code || !form.discount_value) { toast.error('Code and discount value required'); return }
    setLoading(true)
    try {
      const { error } = await supabase.from('coupons').insert({
        code: form.code.toUpperCase(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        minimum_order: form.minimum_order ? parseFloat(form.minimum_order) : 0,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        valid_until: form.valid_until || null,
        is_active: true,
      } as any)
      if (error) throw error
      toast.success('Coupon created!')
      setOpen(false)
      setForm({ code: '', description: '', discount_type: 'percent', discount_value: '', minimum_order: '', usage_limit: '', valid_until: '' })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer">
        <Plus className="w-4 h-4 mr-2" /> New Coupon
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Tag className="w-5 h-5" /> Create Coupon</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Coupon Code *</Label>
                <Input value={form.code} onChange={e => update('code', e.target.value.toUpperCase())} placeholder="SAVE20" className="font-mono uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.discount_type} onValueChange={v => v && update('discount_type', v)}>
                  <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent" className="cursor-pointer">Percentage (%)</SelectItem>
                    <SelectItem value="fixed" className="cursor-pointer">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Discount Value *</Label>
                <Input type="number" min="0" value={form.discount_value} onChange={e => update('discount_value', e.target.value)} placeholder={form.discount_type === 'percent' ? '20' : '10.00'} />
              </div>
              <div className="space-y-1.5">
                <Label>Minimum Order ($)</Label>
                <Input type="number" min="0" value={form.minimum_order} onChange={e => update('minimum_order', e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Usage Limit</Label>
                <Input type="number" min="1" value={form.usage_limit} onChange={e => update('usage_limit', e.target.value)} placeholder="Unlimited" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Valid Until</Label>
                <Input type="date" value={form.valid_until} onChange={e => update('valid_until', e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={e => update('description', e.target.value)} placeholder="e.g. Summer sale discount" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleCreate} disabled={loading} className="rose-gold-gradient border-0 text-white cursor-pointer">
              {loading ? 'Creating...' : 'Create Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
