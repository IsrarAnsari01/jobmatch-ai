'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, Mail, RotateCcw, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const OTP_LENGTH = 6

export function OTPForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first empty input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  const focusInput = (index: number) => {
    inputRefs.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus()
  }

  const updateDigit = useCallback((index: number, value: string) => {
    setError('')
    setDigits((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }, [])

  function handleChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '')

    // Handle paste of full code into a single input
    if (val.length > 1) {
      const chars = val.slice(0, OTP_LENGTH).split('')
      setDigits((prev) => {
        const next = [...prev]
        chars.forEach((c, i) => { if (index + i < OTP_LENGTH) next[index + i] = c })
        return next
      })
      focusInput(Math.min(index + chars.length, OTP_LENGTH - 1))
      return
    }

    updateDigit(index, val)
    if (val) focusInput(index + 1)
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]) {
        updateDigit(index, '')
      } else {
        updateDigit(Math.max(0, index - 1), '')
        focusInput(index - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusInput(index + 1)
    }
  }

  // Handle paste on container
  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!text) return
    const chars = text.split('')
    setDigits((prev) => {
      const next = [...prev]
      chars.forEach((c, i) => { next[i] = c })
      return next
    })
    focusInput(Math.min(chars.length, OTP_LENGTH - 1))
  }

  const otp = digits.join('')
  const isComplete = otp.length === OTP_LENGTH

  async function handleVerify() {
    if (!isComplete || !email) return
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      })

      if (verifyError) {
        // Try 'signup' type as fallback
        const { error: fallbackError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'signup',
        })
        if (fallbackError) {
          setError('Invalid or expired code. Please try again or request a new one.')
          setDigits(Array(OTP_LENGTH).fill(''))
          focusInput(0)
          return
        }
      }

      toast.success('Email verified! Setting up your profile...')
      router.push('/onboarding')
      router.refresh()
    } catch {
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
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })
      if (error) throw error
      toast.success('New code sent! Check your email.')
      setDigits(Array(OTP_LENGTH).fill(''))
      setResendCooldown(60)
      focusInput(0)
    } catch {
      toast.error('Could not resend code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email display */}
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

      {/* OTP Input Boxes */}
      <div>
        <p className="text-sm font-medium mb-3">Enter verification code</p>
        <div
          className="flex gap-2.5 justify-between"
          onPaste={handlePaste}
        >
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className={`
                w-full aspect-square max-w-[52px] text-center text-xl font-bold rounded-xl border-2 bg-background outline-none transition-all duration-150
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
          <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
        ) : (
          <>Verify email <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>

      {/* Resend */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Didn&apos;t receive the code?{' '}
          {resendCooldown > 0 ? (
            <span className="text-muted-foreground/60">
              Resend in {resendCooldown}s
            </span>
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
