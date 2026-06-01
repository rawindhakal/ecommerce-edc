'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

/* ───────── CSV helpers ───────── */
const COLUMNS = ['name', 'slug', 'sku', 'price', 'compare_at_price', 'cost_price', 'category', 'short_description', 'description', 'tags', 'loyalty_points_reward', 'is_active', 'is_featured', 'image_url', 'stock'] as const

function csvEscape(v: any): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let cur: string[] = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQuotes = false
      else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { cur.push(field); field = '' }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++
        cur.push(field); rows.push(cur); cur = []; field = ''
      } else field += c
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur) }
  const cleaned = rows.filter(r => r.some(c => c.trim() !== ''))
  if (cleaned.length < 2) return []
  const headers = cleaned[0].map(h => h.trim())
  return cleaned.slice(1).map(r => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim() })
    return obj
  })
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function BulkActions({ products }: { products: any[] }) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ ok: number; failed: number; errors: string[] } | null>(null)
  const [resultOpen, setResultOpen] = useState(false)

  /* ───────── Export ───────── */
  function handleExport() {
    if (!products.length) { toast.error('No products to export'); return }
    const header = COLUMNS.join(',')
    const lines = products.map(p => {
      const inv = p.inventory?.[0]?.quantity ?? 0
      const row: Record<string, any> = {
        name: p.name, slug: p.slug, sku: p.sku, price: p.price,
        compare_at_price: p.compare_at_price, cost_price: p.cost_price,
        category: p.category?.name || '', short_description: p.short_description,
        description: p.description, tags: (p.tags || []).join('; '),
        loyalty_points_reward: p.loyalty_points_reward,
        is_active: p.is_active, is_featured: p.is_featured,
        image_url: p.images?.[0]?.url || '', stock: inv,
      }
      return COLUMNS.map(c => csvEscape(row[c])).join(',')
    })
    const csv = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${products.length} products`)
  }

  /* ───────── Download template ───────── */
  function downloadTemplate() {
    const sample = [
      COLUMNS.join(','),
      'Rose Glow Serum,rose-glow-serum,SKN-100,2450,3200,900,Skincare,Brightening serum,Full description here,serum; brightening,24,true,true,https://example.com/img.jpg,50',
    ].join('\n')
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'product-import-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  /* ───────── Import ───────── */
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setResult(null)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      if (!rows.length) { toast.error('CSV is empty or invalid'); setImporting(false); return }

      // Load categories for name → id mapping
      const { data: cats } = await supabase.from('categories').select('id, name')
      const catMap = new Map((cats || []).map((c: any) => [c.name.toLowerCase(), c.id]))

      let ok = 0, failed = 0
      const errors: string[] = []

      for (const [idx, row] of rows.entries()) {
        const name = row.name?.trim()
        if (!name || !row.price) { failed++; errors.push(`Row ${idx + 2}: missing name or price`); continue }

        const slug = row.slug?.trim() || slugify(name)
        const images = row.image_url ? [{ url: row.image_url, alt: name }] : []
        const tags = row.tags ? row.tags.split(/[;,]/).map(t => t.trim()).filter(Boolean) : []
        const payload: Record<string, any> = {
          name, slug,
          sku: row.sku || null,
          price: parseFloat(row.price) || 0,
          compare_at_price: row.compare_at_price ? parseFloat(row.compare_at_price) : null,
          cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
          category_id: row.category ? catMap.get(row.category.toLowerCase()) ?? null : null,
          short_description: row.short_description || null,
          description: row.description || null,
          tags,
          loyalty_points_reward: row.loyalty_points_reward ? parseInt(row.loyalty_points_reward) : 0,
          is_active: row.is_active ? /^(true|1|yes)$/i.test(row.is_active) : true,
          is_featured: row.is_featured ? /^(true|1|yes)$/i.test(row.is_featured) : false,
          images,
        }

        // Upsert by slug
        const { data: up, error } = await supabase
          .from('products')
          .upsert(payload, { onConflict: 'slug' })
          .select('id')
          .single()

        if (error) { failed++; errors.push(`Row ${idx + 2} (${name}): ${error.message}`); continue }

        // Ensure inventory row + set stock if provided
        if (up?.id) {
          const stock = row.stock ? parseInt(row.stock) : null
          const { data: existingInv } = await supabase.from('inventory').select('id').eq('product_id', up.id).maybeSingle()
          if (existingInv) {
            if (stock != null) await supabase.from('inventory').update({ quantity: stock }).eq('id', existingInv.id)
          } else {
            await supabase.from('inventory').insert({ product_id: up.id, quantity: stock ?? 0, low_stock_threshold: 10 })
          }
        }
        ok++
      }

      setResult({ ok, failed, errors: errors.slice(0, 10) })
      setResultOpen(true)
      if (ok > 0) router.refresh()
    } catch (err: any) {
      toast.error('Import failed: ' + err.message)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />

      <Button variant="outline" className="cursor-pointer" onClick={handleExport}>
        <Download className="w-4 h-4 mr-2" /> Export CSV
      </Button>
      <Button variant="outline" className="cursor-pointer" disabled={importing} onClick={() => fileRef.current?.click()}>
        {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
        {importing ? 'Importing…' : 'Import CSV'}
      </Button>

      {/* Result dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" /> Import Complete
            </DialogTitle>
          </DialogHeader>
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{result.ok}</p>
                  <p className="text-xs text-green-600">Imported / Updated</p>
                </div>
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  <p className="text-xs text-red-500">Failed</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="bg-muted/40 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">Errors</p>
                  <ul className="space-y-1 text-xs text-red-600">
                    {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
              <Button className="w-full rose-gold-gradient border-0 text-white cursor-pointer" onClick={() => setResultOpen(false)}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Button variant="ghost" size="sm" className="cursor-pointer text-xs text-muted-foreground" onClick={downloadTemplate}>
        Template
      </Button>
    </>
  )
}
