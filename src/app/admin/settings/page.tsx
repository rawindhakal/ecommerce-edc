'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Store, CreditCard, Package, Bell, Trophy, Shield,
  Save, Plus, Trash2, RefreshCw, Check, User, Mail, Phone, Globe, FileText
} from 'lucide-react'

type Settings = Record<string, string>

const DEFAULT_SETTINGS: Settings = {
  store_name: 'Empress Dreams Cosmetics', store_address: 'Kathmandu, Nepal',
  store_phone: '+977-XXXXXXXXXX', store_email: 'hello@glowlux.com',
  store_website: 'https://empressdreams.com', receipt_footer: 'Thank you for shopping at Empress Dreams Cosmetics!',
  vat_rate: '13', vat_enabled: 'true', currency: 'NPR',
  loyalty_enabled: 'true', loyalty_points_per_100: '1', loyalty_redeem_rate: '1',
  tier_silver: '500', tier_gold: '2000', tier_platinum: '5000',
  shipping_free_threshold: '1000', shipping_flat_rate: '150', cod_enabled: 'true',
  notify_new_order: 'true', notify_low_stock: 'true', low_stock_threshold: '10',
  notify_daily_report: 'false', notify_tier_upgrade: 'true',
}

export default function SettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [staff, setStaff] = useState<any[]>([])
  const [addStaffOpen, setAddStaffOpen] = useState(false)
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'staff', password: '' })
  const [addingStaff, setAddingStaff] = useState(false)

  useEffect(() => {
    async function load() {
      const [settingsRes, staffRes] = await Promise.all([
        supabase.from('store_settings').select('key,value'),
        supabase.from('profiles').select('id,full_name,email,role,created_at,is_active').in('role', ['admin', 'staff']),
      ])
      if (settingsRes.data) {
        const m: Settings = { ...DEFAULT_SETTINGS }
        settingsRes.data.forEach((r: any) => { if (r.value != null) m[r.key] = r.value })
        setSettings(m)
      }
      setStaff(staffRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  function set(key: string, value: string) { setSettings(s => ({ ...s, [key]: value })) }
  function toggle(key: string) { setSettings(s => ({ ...s, [key]: s[key] === 'true' ? 'false' : 'true' })) }
  function bool(key: string) { return settings[key] === 'true' }

  async function saveSettings(keys: string[]) {
    setSaving(true)
    try {
      const rows = keys.map(k => ({ key: k, value: settings[k] ?? '' }))
      const { error } = await supabase.from('store_settings').upsert(rows, { onConflict: 'key' })
      if (error) throw error
      toast.success('Settings saved!')
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  async function addStaffMember() {
    if (!newStaff.email || !newStaff.password) { toast.error('Email and password required'); return }
    setAddingStaff(true)
    try {
      const res = await fetch('/api/admin/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Staff member added!')
      setStaff(s => [...s, json.profile])
      setAddStaffOpen(false)
      setNewStaff({ name: '', email: '', role: 'staff', password: '' })
    } catch (err: any) { toast.error(err.message) }
    finally { setAddingStaff(false) }
  }

  async function updateStaffRole(id: string, role: string) {
    const { error } = await supabase.from('profiles').update({ role } as any).eq('id', id)
    if (error) toast.error('Failed to update role')
    else { toast.success('Role updated'); setStaff(s => s.map(m => m.id === id ? { ...m, role } : m)) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your store preferences</p>
      </div>

      <Tabs defaultValue="store">
        <TabsList className="bg-muted/50 border border-border h-auto flex-wrap gap-1 p-1">
          {[
            { value: 'store', label: 'Store Info', icon: Store },
            { value: 'tax', label: 'Tax & Pricing', icon: CreditCard },
            { value: 'loyalty', label: 'Loyalty', icon: Trophy },
            { value: 'shipping', label: 'Shipping', icon: Package },
            { value: 'staff', label: 'Staff & Permissions', icon: Shield },
            { value: 'notifications', label: 'Notifications', icon: Bell },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Store Info ── */}
        <TabsContent value="store" className="mt-6">
          <Card className="admin-card p-6 space-y-5">
            <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Store Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" />Store Name</Label>
                <Input value={settings.store_name} onChange={e => set('store_name', e.target.value)} placeholder="Empress Dreams Cosmetics" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />Phone</Label>
                <Input value={settings.store_phone} onChange={e => set('store_phone', e.target.value)} placeholder="+977-98XXXXXXXX" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Input value={settings.store_address} onChange={e => set('store_address', e.target.value)} placeholder="Street, City, Nepal" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email</Label>
                <Input value={settings.store_email} onChange={e => set('store_email', e.target.value)} type="email" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />Website</Label>
                <Input value={settings.store_website} onChange={e => set('store_website', e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Receipt Footer Message</Label>
                <Input value={settings.receipt_footer} onChange={e => set('receipt_footer', e.target.value)} placeholder="Thank you for your purchase!" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => saveSettings(['store_name','store_phone','store_address','store_email','store_website','receipt_footer'])}
                disabled={saving} className="rose-gold-gradient border-0 text-white cursor-pointer">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Saving…' : 'Save Store Info'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ── Tax & Pricing ── */}
        <TabsContent value="tax" className="mt-6">
          <Card className="admin-card p-6 space-y-5">
            <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Tax & Pricing</h2>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Enable VAT</p>
                <p className="text-sm text-muted-foreground">Apply 13% VAT on all sales</p>
              </div>
              <Switch checked={bool('vat_enabled')} onCheckedChange={() => toggle('vat_enabled')} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>VAT Rate (%)</Label>
                <Input type="number" min="0" max="100" value={settings.vat_rate} onChange={e => set('vat_rate', e.target.value)} />
                <p className="text-xs text-muted-foreground">Nepal standard rate is 13%</p>
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={settings.currency} onChange={e => set('currency', e.target.value)} placeholder="NPR" />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              All prices are displayed in Nepali Rupees (Rs. / NPR) with 13% VAT included in receipts.
            </div>
            <div className="flex justify-end">
              <Button onClick={() => saveSettings(['vat_enabled','vat_rate','currency'])}
                disabled={saving} className="rose-gold-gradient border-0 text-white cursor-pointer">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Saving…' : 'Save Tax Settings'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ── Loyalty ── */}
        <TabsContent value="loyalty" className="mt-6">
          <Card className="admin-card p-6 space-y-5">
            <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Loyalty Program</h2>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Enable Loyalty Program</p>
                <p className="text-sm text-muted-foreground">Customers earn and redeem points</p>
              </div>
              <Switch checked={bool('loyalty_enabled')} onCheckedChange={() => toggle('loyalty_enabled')} />
            </div>
            <Separator />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Points earned per Rs. 100 spent</Label>
                <Input type="number" min="0" value={settings.loyalty_points_per_100} onChange={e => set('loyalty_points_per_100', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Redemption rate (Rs. per point)</Label>
                <Input type="number" min="0" step="0.1" value={settings.loyalty_redeem_rate} onChange={e => set('loyalty_redeem_rate', e.target.value)} />
                <p className="text-xs text-muted-foreground">1 point = Rs. {settings.loyalty_redeem_rate}</p>
              </div>
            </div>
            <Separator />
            <h3 className="font-semibold text-sm">Tier Thresholds (minimum points)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { key: null, label: '🥉 Bronze', value: '0', disabled: true },
                { key: 'tier_silver', label: '🥈 Silver', value: settings.tier_silver },
                { key: 'tier_gold', label: '🥇 Gold', value: settings.tier_gold },
                { key: 'tier_platinum', label: '💎 Platinum', value: settings.tier_platinum },
              ].map(tier => (
                <div key={tier.label} className="space-y-1.5">
                  <Label>{tier.label}</Label>
                  <Input
                    type="number" min="0"
                    value={tier.value}
                    disabled={!tier.key}
                    onChange={e => tier.key && set(tier.key, e.target.value)}
                    className={!tier.key ? 'opacity-50' : ''}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => saveSettings(['loyalty_enabled','loyalty_points_per_100','loyalty_redeem_rate','tier_silver','tier_gold','tier_platinum'])}
                disabled={saving} className="rose-gold-gradient border-0 text-white cursor-pointer">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Saving…' : 'Save Loyalty Settings'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ── Shipping ── */}
        <TabsContent value="shipping" className="mt-6">
          <Card className="admin-card p-6 space-y-5">
            <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Shipping Settings</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Free Shipping Threshold (रू)</Label>
                <Input type="number" min="0" value={settings.shipping_free_threshold} onChange={e => set('shipping_free_threshold', e.target.value)} />
                <p className="text-xs text-muted-foreground">Orders above this amount get free shipping</p>
              </div>
              <div className="space-y-1.5">
                <Label>Flat Rate Shipping (रू)</Label>
                <Input type="number" min="0" value={settings.shipping_flat_rate} onChange={e => set('shipping_flat_rate', e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border border-border rounded-xl px-4">
              <div>
                <p className="font-medium">Cash on Delivery (COD)</p>
                <p className="text-sm text-muted-foreground">Allow customers to pay on delivery</p>
              </div>
              <Switch checked={bool('cod_enabled')} onCheckedChange={() => toggle('cod_enabled')} />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => saveSettings(['shipping_free_threshold','shipping_flat_rate','cod_enabled'])}
                disabled={saving} className="rose-gold-gradient border-0 text-white cursor-pointer">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Saving…' : 'Save Shipping Settings'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ── Staff & Permissions ── */}
        <TabsContent value="staff" className="mt-6 space-y-4">
          <Card className="admin-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-display font-semibold text-lg">Staff & Admin</h2>
              <Button onClick={() => setAddStaffOpen(true)} size="sm" className="rose-gold-gradient border-0 text-white cursor-pointer">
                <Plus className="w-4 h-4 mr-1.5" />Add Staff
              </Button>
            </div>
            <div className="divide-y divide-border">
              {staff.map(member => (
                <div key={member.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="rose-gold-gradient text-white text-sm font-bold">
                        {(member.full_name || member.email || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.full_name || 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={member.role} onValueChange={v => v && updateStaffRole(member.id, v)}>
                      <SelectTrigger className="w-24 h-8 text-xs cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin" className="cursor-pointer text-xs">Admin</SelectItem>
                        <SelectItem value="staff" className="cursor-pointer text-xs">Staff</SelectItem>
                        <SelectItem value="customer" className="cursor-pointer text-xs">Revoke</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge className={member.role === 'admin' ? 'bg-rose-50 text-rose-700 border-rose-200 border text-xs' : 'bg-blue-50 text-blue-700 border-blue-200 border text-xs'}>
                      {member.role}
                    </Badge>
                  </div>
                </div>
              ))}
              {staff.length === 0 && (
                <div className="py-10 text-center text-muted-foreground text-sm">No staff members yet</div>
              )}
            </div>
          </Card>

          <Card className="admin-card p-5">
            <h3 className="font-semibold mb-3">Permission Levels</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { role: 'Admin', perms: ['Full access to all features', 'Manage staff & settings', 'View all reports', 'Manage loyalty program'] },
                { role: 'Staff', perms: ['POS terminal access', 'View orders & customers', 'Manage inventory', 'Cannot change settings'] },
              ].map(item => (
                <div key={item.role} className="border border-border rounded-xl p-4">
                  <p className="font-semibold mb-2 text-primary">{item.role}</p>
                  <ul className="space-y-1 text-muted-foreground">
                    {item.perms.map(p => <li key={p} className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-600" />{p}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ── Notifications ── */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="admin-card p-6 space-y-4">
            <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Notification Settings</h2>
            {[
              { key: 'notify_new_order', label: 'New Order Alert', desc: 'Get notified when a new order is placed' },
              { key: 'notify_low_stock', label: 'Low Stock Alert', desc: 'Alert when product stock falls below threshold' },
              { key: 'notify_daily_report', label: 'Daily Report Email', desc: 'Receive end-of-day summary report' },
              { key: 'notify_tier_upgrade', label: 'Loyalty Tier Upgrade', desc: 'Notify when a customer upgrades tier' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={bool(item.key)} onCheckedChange={() => toggle(item.key)} />
              </div>
            ))}
            <div className="space-y-1.5 pt-2">
              <Label>Low Stock Threshold (units)</Label>
              <Input type="number" min="1" value={settings.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)} className="max-w-xs" />
              <p className="text-xs text-muted-foreground">Alert when stock drops below this number</p>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => saveSettings(['notify_new_order','notify_low_stock','notify_daily_report','notify_tier_upgrade','low_stock_threshold'])}
                disabled={saving} className="rose-gold-gradient border-0 text-white cursor-pointer">
                <Save className="w-4 h-4 mr-2" />{saving ? 'Saving…' : 'Save Notifications'}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Staff Dialog */}
      <Dialog open={addStaffOpen} onOpenChange={setAddStaffOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-display">Add Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={newStaff.name} onChange={e => setNewStaff(s => ({ ...s, name: e.target.value }))} placeholder="Staff name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input value={newStaff.email} onChange={e => setNewStaff(s => ({ ...s, email: e.target.value }))} type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <Input value={newStaff.password} onChange={e => setNewStaff(s => ({ ...s, password: e.target.value }))} type="password" required placeholder="Min 6 characters" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newStaff.role} onValueChange={v => v && setNewStaff(s => ({ ...s, role: v }))}>
                <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff" className="cursor-pointer">Staff</SelectItem>
                  <SelectItem value="admin" className="cursor-pointer">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setAddStaffOpen(false)}>Cancel</Button>
            <Button onClick={addStaffMember} disabled={addingStaff} className="flex-1 rose-gold-gradient border-0 text-white cursor-pointer">
              {addingStaff ? 'Adding…' : 'Add Staff'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
