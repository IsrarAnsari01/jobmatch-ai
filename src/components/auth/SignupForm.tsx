'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="flex gap-3 mt-1.5">
      {checks.map(({ label, pass }) => (
        <div key={label} className="flex items-center gap-1 text-xs">
          <CheckCircle2 className={`h-3 w-3 ${pass ? 'text-green-500' : 'text-muted-foreground/40'}`} />
          <span className={pass ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
        </div>
      ))}
    </div>
  )
}

export function SignupForm() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      })

      if (signupError) {
        setError(signupError.message)
        return
      }

      toast.success('Account created! Please verify your email.')
      router.push(`/verify?email=${encodeURIComponent(email.trim())}`)
      router.refresh()
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
        <Label htmlFor="fullName" className="text-sm font-medium">Full name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Jane Smith"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setError('') }}
          required
          disabled={loading}
          className="h-11"
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
          required
          disabled={loading}
          className="h-11"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            required
            disabled={loading}
            className="h-11 pr-10"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrength password={password} />
      </div>

      <Button
        type="submit"
        className="w-full h-11 font-semibold"
        disabled={loading || !email || !password || !fullName}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create free account'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By signing up you agree to our{' '}
        <span className="underline cursor-pointer hover:text-foreground">Terms of Service</span>
        {' '}and{' '}
        <span className="underline cursor-pointer hover:text-foreground">Privacy Policy</span>
      </p>
    </form>
  )
}
