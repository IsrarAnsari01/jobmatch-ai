import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BrainCircuit, FileSearch, Star, Send } from 'lucide-react'

const steps = [
  { icon: FileSearch, title: 'Upload your resume', desc: 'PDF upload, analyzed by GPT-4o in seconds' },
  { icon: Star, title: 'Get 90+ matches only', desc: 'We filter out low-quality listings for you' },
  { icon: Send, title: 'Apply with one click', desc: 'Resume sent directly to the HR contact' },
]

export default function SignupPage() {
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

        <div className="relative space-y-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              Free to get started
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Let AI find your dream job
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              Stop spending hours on job boards. Upload your resume and our AI does the work.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-9 h-9 bg-indigo-500/20 border border-indigo-400/30 rounded-xl flex items-center justify-center">
                  <Icon className="h-4 w-4 text-indigo-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-400 font-bold">0{i + 1}</span>
                    <p className="text-white text-sm font-semibold">{title}</p>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-slate-500 text-xs mb-3">40+ jobs per refresh · sourced from</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5">
            {[
              { name: 'RemoteOK',   color: 'bg-cyan-400' },
              { name: 'Jobicy',     color: 'bg-teal-400' },
              { name: 'WWR',        color: 'bg-lime-400' },
              { name: 'WorkNomads', color: 'bg-sky-400' },
              { name: 'Himalayas',  color: 'bg-violet-400' },
              { name: 'Arbeitnow',  color: 'bg-rose-400' },
              { name: 'Remotive',   color: 'bg-fuchsia-400' },
            ].map(({ name, color }) => (
              <span key={name} className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-5 sm:px-6 py-10 sm:py-12 bg-background">
        <div className="w-full max-w-[400px] space-y-8">
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
            <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
            <p className="text-muted-foreground text-sm">
              Start finding jobs that truly fit your profile
            </p>
          </div>

          <SignupForm />

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
