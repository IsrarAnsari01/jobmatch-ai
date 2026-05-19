'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function ForgotPasswordForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          // redirectTo is only used if the user clicks a link — with OTP flow it is ignored
          redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`,
        }
      )

      if (resetError) {
        setError(resetError.message)
        return
      }

      toast.success('Reset code sent! Check your email.')
      // Send to OTP verification page with type=recovery so OTPForm knows the flow
      router.push(`/verify?email=${encodeURIComponent(email.trim())}&type=recovery`)
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

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            required
            disabled={loading}
            className="h-11 pl-9"
            autoComplete="email"
            autoFocus
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-11 font-semibold gap-2"
        disabled={loading || !email.trim()}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Sending code...</>
        ) : (
          'Send 6-digit code'
        )}
      </Button>
    </form>
  )
}
