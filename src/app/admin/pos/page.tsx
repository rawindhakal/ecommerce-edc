import { createClient } from '@/lib/supabase/server'
import POSTerminal from './pos-terminal'
import type { Product } from '@/types/supabase'

async function getProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, category:categories(name, slug), inventory(quantity)')
    .eq('is_active', true)
    .gt('inventory.quantity', 0)
    .order('name')
  return (data as Product[]) || []
}

export default async function POSPage() {
  const products = await getProducts()
  return <POSTerminal products={products} />
}

export const dynamic = 'force-dynamic'
