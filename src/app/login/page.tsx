import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BrainCircuit, Sparkles, TrendingUp, Users } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex-col justify-between p-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">JobMatch AI</span>
          </div>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Your next career move starts here
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              AI-powered job matching that reads your resume and finds roles where you genuinely stand out.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, value: '90+', label: 'Match Score' },
              { icon: Users, value: '1-Click', label: 'Apply to HR' },
              { icon: Sparkles, value: 'GPT-4o', label: 'Powered' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <Icon className="h-5 w-5 text-indigo-300 mb-2" />
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
            <p className="text-slate-300 text-sm leading-relaxed italic">
              &ldquo;I uploaded my resume and within minutes had 12 highly relevant job matches — all scoring above 92%. Got interviews at 3 companies that week.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold">
                AK
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Ahmed K.</p>
                <p className="text-slate-400 text-xs">Senior Frontend Engineer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform logos */}
        <div className="relative">
          <p className="text-slate-500 text-xs mb-3">Jobs sourced from</p>
          <div className="flex items-center gap-4">
            {['LinkedIn', 'Indeed', 'Glassdoor', 'ZipRecruiter'].map((name) => (
              <span key={name} className="text-slate-400 text-sm font-medium">{name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-6 py-10 sm:py-12 bg-background">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BrainCircuit className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">JobMatch AI</span>
            </div>
            <ThemeToggle />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to see your latest job matches
            </p>
          </div>

          <LoginForm />

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline underline-offset-4">
              Create one free
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
