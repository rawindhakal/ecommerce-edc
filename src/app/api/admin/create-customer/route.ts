import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Uses service role key — runs server-side only
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const { name, phone, email } = await request.json()

    // Generate a unique internal email if none provided
    const authEmail = email?.trim() || `${phone?.replace(/\D/g, '') || Date.now()}@pos.glowlux.local`
    // Random strong password (not user-facing)
    const tempPassword = crypto.randomUUID() + crypto.randomUUID()

    // Create the auth user via admin API
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: tempPassword,
      email_confirm: true,           // skip confirmation email
      user_metadata: { full_name: name || null },
    })

    if (authErr) {
      // If email already exists, look up by email instead
      if (authErr.message.includes('already been registered') || authErr.code === 'email_exists') {
        const { data: existing } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', authEmail)
          .single()
        if (existing) return NextResponse.json({ customer: existing })
      }
      throw authErr
    }

    const userId = authData.user.id

    // The handle_new_user trigger auto-creates a basic profile.
    // Update it with the POS-supplied details.
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: name || null,
        phone: phone || null,
        role: 'customer',
      })
      .eq('id', userId)
      .select()
      .single()

    if (profileErr) throw profileErr

    return NextResponse.json({ customer: profile })
  } catch (err: any) {
    console.error('[create-customer]', err)
    return NextResponse.json({ error: err.message || 'Failed to create customer' }, { status: 400 })
  }
}
