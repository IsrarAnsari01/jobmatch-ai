import { Suspense } from 'react'
import { BrainCircuit, ShieldCheck, Mail } from 'lucide-react'
import Link from 'next/link'
import { OTPForm } from '@/components/auth/OTPForm'

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">JobMatch AI</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-indigo-300" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Keeping your account secure
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              We sent a 6-digit verification code to your email. This ensures only you can access your account.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: Mail, text: 'Check your inbox and spam folder' },
              { icon: ShieldCheck, text: 'Code expires in 10 minutes' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-indigo-300" />
                </div>
                <p className="text-slate-300 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-slate-500 text-xs">
            Having trouble? Contact{' '}
            <span className="text-slate-400 underline cursor-pointer">support</span>
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BrainCircuit className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">JobMatch AI</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enter the 6-digit code we sent you to verify your account and get started.
            </p>
          </div>

          <Suspense fallback={null}>
            <OTPForm />
          </Suspense>

          <div className="text-center text-sm text-muted-foreground">
            Wrong email?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline underline-offset-4">
              Sign up again
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
