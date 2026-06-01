'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [inventory, setInventory] = useState({ quantity: 0, low_stock_threshold: 10 })
  const [form, setForm] = useState({
    name: '', slug: '', sku: '', description: '', short_description: '',
    price: '', compare_at_price: '', cost_price: '',
    loyalty_points_reward: '0', tags: '',
    is_active: true, is_featured: false,
    image_url: '', image_alt: '',
    how_to_use: '', ingredients: '',
  })

  useEffect(() => {
    async function load() {
      const [prodRes, invRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('inventory').select('quantity,low_stock_threshold').eq('product_id', id).single(),
      ])
      if (prodRes.data) {
        const p = prodRes.data
        setForm({
          name: p.name || '', slug: p.slug || '', sku: p.sku || '',
          description: p.description || '', short_description: p.short_description || '',
          price: String(p.price || ''), compare_at_price: String(p.compare_at_price || ''),
          cost_price: String(p.cost_price || ''),
          loyalty_points_reward: String(p.loyalty_points_reward || 0),
          tags: (p.tags || []).join(', '),
          is_active: p.is_active ?? true, is_featured: p.is_featured ?? false,
          image_url: p.images?.[0]?.url || '', image_alt: p.images?.[0]?.alt || '',
          how_to_use: p.how_to_use || '', ingredients: p.ingredients || '',
        })
      }
      if (invRes.data) setInventory({ quantity: invRes.data.quantity, low_stock_threshold: invRes.data.low_stock_threshold })
      setFetching(false)
    }
    load()
  }, [id])

  function update(field: string, value: string | boolean) {
    setForm(f => {
      const updated = { ...f, [field]: value }
      if (field === 'name' && typeof value === 'string' && !f.slug) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }
      return updated
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const images = form.image_url ? [{ url: form.image_url, alt: form.image_alt || form.name }] : []
      const { error } = await supabase.from('products').update({
        name: form.name, slug: form.slug, sku: form.sku || null,
        description: form.description || null, short_description: form.short_description || null,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        loyalty_points_reward: parseInt(form.loyalty_points_reward) || 0,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images, is_active: form.is_active, is_featured: form.is_featured,
        how_to_use: form.how_to_use || null, ingredients: form.ingredients || null,
      } as any).eq('id', id)
      if (error) throw error
      toast.success('Product updated!')
      router.push('/admin/products')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  async function updateInventory() {
    const { error } = await supabase.from('inventory').update({ quantity: inventory.quantity, low_stock_threshold: inventory.low_stock_threshold } as any).eq('product_id', id)
    if (error) toast.error('Failed to update inventory')
    else toast.success('Inventory updated!')
  }

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="cursor-pointer">
          <Link href="/admin/products"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground text-sm">{form.name}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={form.is_active ? 'default' : 'secondary'}>{form.is_active ? 'Active' : 'Draft'}</Badge>
          {form.is_featured && <Badge className="rose-gold-gradient border-0 text-white">Featured</Badge>}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 admin-card space-y-4">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Basic Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={e => update('name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>URL Slug</Label>
              <Input value={form.slug} onChange={e => update('slug', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => update('sku', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Short Description</Label>
            <Input value={form.short_description} onChange={e => update('short_description', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Full Description</Label>
            <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} />
          </div>
        </Card>

        <Card className="p-6 admin-card space-y-4">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Pricing (NPR रू)</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Price *</Label>
              <Input type="number" step="0.01" min="0" value={form.price} onChange={e => update('price', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Compare At Price</Label>
              <Input type="number" step="0.01" min="0" value={form.compare_at_price} onChange={e => update('compare_at_price', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cost Price</Label>
              <Input type="number" step="0.01" min="0" value={form.cost_price} onChange={e => update('cost_price', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5 max-w-xs">
            <Label>Loyalty Points Reward</Label>
            <Input type="number" min="0" value={form.loyalty_points_reward} onChange={e => update('loyalty_points_reward', e.target.value)} />
          </div>
        </Card>

        <Card className="p-6 admin-card space-y-4">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Media</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Primary Image URL</Label>
              <Input value={form.image_url} onChange={e => update('image_url', e.target.value)} placeholder="https://…" />
            </div>
            <div className="space-y-1.5">
              <Label>Image Alt Text</Label>
              <Input value={form.image_alt} onChange={e => update('image_alt', e.target.value)} />
            </div>
          </div>
          {form.image_url && (
            <img src={form.image_url} alt={form.image_alt} className="w-32 h-32 object-cover rounded-xl border" />
          )}
        </Card>

        <Card className="p-6 admin-card space-y-4">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Details</h2>
          <div className="space-y-1.5">
            <Label>How to Use</Label>
            <Textarea value={form.how_to_use} onChange={e => update('how_to_use', e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Key Ingredients</Label>
            <Textarea value={form.ingredients} onChange={e => update('ingredients', e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <Input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="serum, vitamin-c (comma-separated)" />
          </div>
        </Card>

        <Card className="p-6 admin-card space-y-4">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Visibility</h2>
          <div className="flex items-center justify-between">
            <div><p className="font-medium text-sm">Active</p><p className="text-xs text-muted-foreground">Visible in store</p></div>
            <Switch checked={form.is_active} onCheckedChange={v => update('is_active', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div><p className="font-medium text-sm">Featured</p><p className="text-xs text-muted-foreground">Show on homepage</p></div>
            <Switch checked={form.is_featured} onCheckedChange={v => update('is_featured', v)} />
          </div>
        </Card>

        {/* Inventory card */}
        <Card className="p-6 admin-card space-y-4">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Inventory</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Current Stock</Label>
              <Input type="number" min="0" value={inventory.quantity} onChange={e => setInventory(i => ({ ...i, quantity: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Low Stock Threshold</Label>
              <Input type="number" min="0" value={inventory.low_stock_threshold} onChange={e => setInventory(i => ({ ...i, low_stock_threshold: parseInt(e.target.value) || 10 }))} />
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={updateInventory} className="cursor-pointer">Update Inventory</Button>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild className="cursor-pointer"><Link href="/admin/products">Cancel</Link></Button>
          <Button type="submit" disabled={loading} className="rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer">
            <Save className="w-4 h-4 mr-2" />{loading ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
