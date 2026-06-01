'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function AddCustomerDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name && !form.phone && !form.email) { toast.error('Fill in at least one field'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/create-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`Customer added! Code: #${json.customer.customer_code || '—'}`)
      setOpen(false)
      setForm({ name: '', phone: '', email: '' })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add customer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer">
        <UserPlus className="w-4 h-4 mr-2" /> Add Customer
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Add New Customer
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Customer name" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="98XXXXXXXX" type="tel" />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="customer@email.com" type="email" />
            </div>
            <p className="text-xs text-muted-foreground">A unique 4-digit customer code will be auto-generated.</p>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1 cursor-pointer" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="flex-1 rose-gold-gradient border-0 text-white cursor-pointer">
                {loading ? 'Adding…' : 'Add Customer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
