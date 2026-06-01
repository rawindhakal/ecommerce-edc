'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Sparkles, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import BrandName from '@/components/brand-name'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('Access denied. Admin or staff account required.')
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single()

      if (!profile || !['admin', 'staff'].includes(profile.role)) {
        await supabase.auth.signOut()
        throw new Error('Access denied. Admin or staff account required.')
      }

      toast.success(`Welcome back, ${profile.full_name || email}!`)
      router.push('/admin')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
      <h1 className="font-display text-xl font-bold text-white mb-6">Sign in to Admin</h1>

      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-slate-300 text-sm">Email address</Label>
          <Input
            id="email" type="email" required autoFocus
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="admin@glowlux.com"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-slate-300 text-sm">Password</Label>
          <div className="relative">
            <Input
              id="password" type={showPw ? 'text' : 'password'} required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary rounded-xl pr-10"
            />
            <button
              type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <Button type="submit" disabled={loading}
          className="w-full rose-gold-gradient border-0 text-white hover:opacity-90 h-11 rounded-xl font-medium cursor-pointer mt-2">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </span>
          ) : 'Sign In'}
        </Button>
      </form>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rose-gold-gradient rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <BrandName className="font-display text-xl font-bold text-white" />
              <p className="text-xs text-slate-400">Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            Secure admin access
          </div>
        </div>

        <Suspense fallback={<div className="bg-slate-800/60 rounded-2xl p-8 h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-slate-500 text-xs mt-6">
          <BrandName /> Admin Panel · Restricted Access
        </p>
      </div>
    </div>
  )
}
