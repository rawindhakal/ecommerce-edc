import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    if (!['admin', 'staff'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: name || null },
    })
    if (authErr) throw authErr

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update({ full_name: name || null, role })
      .eq('id', authData.user.id)
      .select()
      .single()
    if (profileErr) throw profileErr

    return NextResponse.json({ profile })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create staff' }, { status: 400 })
  }
}
