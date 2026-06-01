'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', slug: '', sku: '', description: '', short_description: '',
    price: '', compare_at_price: '', cost_price: '',
    loyalty_points_reward: '0', tags: '',
    is_active: true, is_featured: false,
    image_url: '', image_alt: '',
    how_to_use: '', ingredients: '',
  })

  function updateField(field: string, value: string | boolean) {
    setForm(f => {
      const updated = { ...f, [field]: value }
      if (field === 'name' && typeof value === 'string') {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    setLoading(true)
    try {
      const images = form.image_url ? [{ url: form.image_url, alt: form.image_alt || form.name }] : []
      const { data: product, error } = await supabase.from('products').insert({
        name: form.name, slug: form.slug, sku: form.sku || null,
        description: form.description || null,
        short_description: form.short_description || null,
        price: parseFloat(form.price),
        compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        loyalty_points_reward: parseInt(form.loyalty_points_reward) || 0,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        images, is_active: form.is_active, is_featured: form.is_featured,
        how_to_use: form.how_to_use || null, ingredients: form.ingredients || null,
      }).select().single()

      if (error) throw error

      // Create inventory record
      if (product) {
        await supabase.from('inventory').insert({ product_id: product.id, quantity: 0, low_stock_threshold: 10 })
      }

      toast.success('Product created successfully!')
      router.push('/admin/products')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="cursor-pointer">
          <Link href="/admin/products"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">New Product</h1>
          <p className="text-muted-foreground text-sm">Add a new product to your catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 admin-card space-y-4">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Basic Information</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" value={form.name} onChange={e => updateField('name', e.target.value)} required placeholder="e.g. Radiance Renewal Serum" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" value={form.slug} onChange={e => updateField('slug', e.target.value)} placeholder="auto-generated" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={e => updateField('sku', e.target.value)} placeholder="e.g. SKN-001" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="short_description">Short Description</Label>
            <Input id="short_description" value={form.short_description} onChange={e => updateField('short_description', e.target.value)} placeholder="Brief product summary (shown in listings)" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Full Description</Label>
            <Textarea id="description" value={form.description} onChange={e => updateField('description', e.target.value)} rows={4} placeholder="Detailed product description..." />
          </div>
        </Card>

        <Card className="p-6 admin-card space-y-4">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Pricing</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (USD) *</Label>
              <Input id="price" type="number" step="0.01" min="0" value={form.price} onChange={e => updateField('price', e.target.value)} required placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="compare_at_price">Compare At Price</Label>
              <Input id="compare_at_price" type="number" step="0.01" min="0" value={form.compare_at_price} onChange={e => updateField('compare_at_price', e.target.value)} placeholder="0.00" />
              <p className="text-xs text-muted-foreground">Original price (shows discount)</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost_price">Cost Price</Label>
              <Input id="cost_price" type="number" step="0.01" min="0" value={form.cost_price} onChange={e => updateField('cost_price', e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loyalty_points_reward">Loyalty Points Reward</Label>
            <Input id="loyalty_points_reward" type="number" min="0" value={form.loyalty_points_reward} onChange={e => updateField('loyalty_points_reward', e.target.value)} />
            <p className="text-xs text-muted-foreground">Points earned per purchase</p>
          </div>
        </Card>

        <Card className="p-6 admin-card space-y-4">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Media</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="image_url">Primary Image URL</Label>
              <Input id="image_url" value={form.image_url} onChange={e => updateField('image_url', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image_alt">Image Alt Text</Label>
              <Input id="image_alt" value={form.image_alt} onChange={e => updateField('image_alt', e.target.value)} placeholder="Describe the image" />
            </div>
          </div>
        </Card>

        <Card className="p-6 admin-card space-y-4">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3">Details</h2>
          <div className="space-y-1.5">
            <Label htmlFor="how_to_use">How to Use</Label>
            <Textarea id="how_to_use" value={form.how_to_use} onChange={e => updateField('how_to_use', e.target.value)} rows={3} placeholder="Application instructions..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ingredients">Key Ingredients</Label>
            <Textarea id="ingredients" value={form.ingredients} onChange={e => updateField('ingredients', e.target.value)} rows={2} placeholder="Active ingredients..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" value={form.tags} onChange={e => updateField('tags', e.target.value)} placeholder="serum, vitamin-c, brightening (comma-separated)" />
          </div>
        </Card>

        <Card className="p-6 admin-card">
          <h2 className="font-display font-semibold text-lg border-b border-border pb-3 mb-4">Visibility</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Active</p>
                <p className="text-xs text-muted-foreground">Show this product in the store</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={v => updateField('is_active', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Featured</p>
                <p className="text-xs text-muted-foreground">Show on homepage & featured section</p>
              </div>
              <Switch checked={form.is_featured} onCheckedChange={v => updateField('is_featured', v)} />
            </div>
          </div>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild className="cursor-pointer">
            <Link href="/admin/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading} className="rose-gold-gradient border-0 text-white hover:opacity-90 cursor-pointer">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}
