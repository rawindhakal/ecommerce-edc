import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { ORDER_DELETE_PIN } from '@/lib/store-config'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const { orderId, pin } = await request.json()
    if (!orderId) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
    if (pin !== ORDER_DELETE_PIN) {
      return NextResponse.json({ error: 'Incorrect PIN. Deletion not authorized.' }, { status: 403 })
    }

    // Detach references that don't cascade
    await supabaseAdmin.from('loyalty_transactions').update({ order_id: null }).eq('order_id', orderId)
    await supabaseAdmin.from('reviews').update({ order_id: null }).eq('order_id', orderId)
    // order_items have ON DELETE CASCADE, removed automatically
    const { error } = await supabaseAdmin.from('orders').delete().eq('id', orderId)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete order' }, { status: 400 })
  }
}
