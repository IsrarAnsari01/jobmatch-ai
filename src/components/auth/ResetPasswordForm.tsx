'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars',    pass: password.length >= 8 },
    { label: 'Uppercase',   pass: /[A-Z]/.test(password) },
    { label: 'Number',      pass: /\d/.test(password) },
    { label: 'Symbol',      pass: /[^a-zA-Z0-9]/.test(password) },
  ]
  if (!password) return null
  const score = checks.filter(c => c.pass).length
  const barColor = score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-amber-500' : score === 3 ? 'bg-yellow-500' : 'bg-emerald-500'
  const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong'

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? barColor : 'bg-muted'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {checks.map(({ label: l, pass }) => (
            <div key={l} className="flex items-center gap-1 text-xs">
              <CheckCircle2 className={`h-3 w-3 ${pass ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />
              <span className={pass ? 'text-foreground' : 'text-muted-foreground'}>{l}</span>
            </div>
          ))}
        </div>
        <span className={`text-xs font-semibold ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-amber-500' : score === 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>
          {label}
        </span>
      </div>
    </div>
  )
}

export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const mismatch = confirm.length > 0 && password !== confirm

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()

      // Confirm session is still valid before attempting update
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Your reset session has expired. Please request a new reset code.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        console.error('[ResetPassword] updateUser error:', updateError)
        setError(updateError.message)
        return
      }

      toast.success('Password updated! Signing you in…')
      // Full navigation to commit the new auth state
      window.location.href = '/dashboard'
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* New password */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium">New password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPwd ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            required
            disabled={loading}
            className="h-11 pr-10"
            autoComplete="new-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrength password={password} />
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirm" className="text-sm font-medium">Confirm new password</Label>
        <div className="relative">
          <Input
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter your new password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError('') }}
            required
            disabled={loading}
            className={`h-11 pr-10 ${mismatch ? 'border-destructive focus-visible:border-destructive' : ''}`}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {mismatch && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />Passwords don&apos;t match
          </p>
        )}
        {confirm && !mismatch && (
          <p className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />Passwords match
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-11 font-semibold"
        disabled={loading || !password || !confirm || mismatch || password.length < 8}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Updating password…</>
        ) : (
          'Set new password'
        )}
      </Button>
    </form>
  )
}
