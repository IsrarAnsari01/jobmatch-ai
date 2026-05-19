'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Mail, RotateCcw, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const OTP_LENGTH = 6

export function OTPForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const isRecovery = searchParams.get('type') === 'recovery'

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown(c => c - 1), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const focusInput = (i: number) =>
    inputRefs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus()

  const updateDigit = useCallback((i: number, v: string) => {
    setError('')
    setDigits(prev => { const n = [...prev]; n[i] = v; return n })
  }, [])

  function handleChange(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '')
    if (val.length > 1) {
      const chars = val.slice(0, OTP_LENGTH).split('')
      setDigits(prev => {
        const n = [...prev]
        chars.forEach((c, j) => { if (i + j < OTP_LENGTH) n[i + j] = c })
        return n
      })
      focusInput(Math.min(i + chars.length, OTP_LENGTH - 1))
      return
    }
    updateDigit(i, val)
    if (val) focusInput(i + 1)
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) updateDigit(i, '')
      else { updateDigit(Math.max(0, i - 1), ''); focusInput(i - 1) }
    } else if (e.key === 'ArrowLeft')  { e.preventDefault(); focusInput(i - 1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focusInput(i + 1) }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!text) return
    setDigits(prev => {
      const n = [...prev]
      text.split('').forEach((c, i) => { n[i] = c })
      return n
    })
    focusInput(Math.min(text.length, OTP_LENGTH - 1))
  }

  const otp = digits.join('')
  const isComplete = otp.length === OTP_LENGTH

  async function handleVerify() {
    if (!isComplete || !email) return
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      if (isRecovery) {
        // ── Password reset OTP ──
        const { data, error: err } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'recovery',
        })

        if (err) {
          console.error('[OTP] recovery verify error:', err)
          setError(err.message || 'Invalid or expired code. Please request a new one.')
          setDigits(Array(OTP_LENGTH).fill(''))
          focusInput(0)
          return
        }

        if (!data.session) {
          setError('Verification succeeded but no session was created. Please try again.')
          return
        }

        toast.success('Code verified! Set your new password.')
        // Use full navigation so the session cookie is committed before the page loads
        window.location.href = '/reset-password'
      } else {
        // ── Signup email confirmation OTP ──
        // Supabase requires type:'signup' for confirming email after signUp()
        const { data, error: signupErr } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'signup',
        })

        if (signupErr) {
          console.error('[OTP] signup verify error:', signupErr)
          // Fallback: try 'email' type (used when project has email OTP mode enabled)
          const { data: d2, error: emailErr } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: 'email',
          })

          if (emailErr) {
            console.error('[OTP] email verify fallback error:', emailErr)
            setError('Invalid or expired code. Please request a new one.')
            setDigits(Array(OTP_LENGTH).fill(''))
            focusInput(0)
            return
          }

          if (!d2.session) {
            setError('Code accepted but session not established. Please try signing in.')
            return
          }

          toast.success('Email verified!')
          window.location.href = '/onboarding'
          return
        }

        if (!data.session) {
          setError('Code accepted but session not established. Please try signing in.')
          return
        }

        toast.success('Email verified!')
        window.location.href = '/onboarding'
      }
    } catch (err) {
      console.error('[OTP] unexpected error:', err)
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!email || resendCooldown > 0) return
    setResending(true)
    setError('')

    try {
      const supabase = createClient()

      if (isRecovery) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/reset-password`,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.resend({ type: 'signup', email })
        if (error) throw error
      }

      toast.success('New code sent! Check your email.')
      setDigits(Array(OTP_LENGTH).fill(''))
      setResendCooldown(60)
      focusInput(0)
    } catch (err) {
      console.error('[OTP] resend error:', err)
      toast.error('Could not resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email badge */}
      {email && (
        <div className="flex items-center gap-2.5 bg-muted/50 rounded-xl px-4 py-3 border">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Code sent to</p>
            <p className="text-sm font-semibold truncate">{email}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* OTP boxes */}
      <div>
        <p className="text-sm font-medium mb-3">Enter 6-digit code</p>
        <div className="flex gap-2.5 justify-between" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              className={`
                w-full aspect-square max-w-[52px] text-center text-xl font-bold rounded-xl border-2
                bg-background outline-none transition-all duration-150
                ${digit ? 'border-primary text-primary' : 'border-border text-foreground'}
                focus:border-primary focus:ring-4 focus:ring-primary/10 focus:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed
                ${error ? 'border-destructive/50 focus:border-destructive focus:ring-destructive/10' : ''}
              `}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Verify button */}
      <Button
        className="w-full h-11 font-semibold gap-2"
        onClick={handleVerify}
        disabled={!isComplete || loading || !email}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</>
        ) : (
          <>{isRecovery ? 'Verify & continue' : 'Verify email'} <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>

      {/* Resend */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?{' '}
          {resendCooldown > 0 ? (
            <span className="text-muted-foreground/60">Resend in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1 text-primary font-semibold hover:underline underline-offset-4 disabled:opacity-50"
            >
              {resending && <RotateCcw className="h-3.5 w-3.5 animate-spin" />}
              Resend code
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
