import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  BrainCircuit, FileText, MailCheck, Star, ArrowRight,
  Sparkles, Shield, Zap, TrendingUp, CheckSquare
} from 'lucide-react'

const features = [
  { icon: FileText,     title: 'Resume Intelligence',  desc: 'GPT-4o extracts every skill, role, and keyword from your PDF — no manual input needed.',         color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950' },
  { icon: Star,         title: 'AI Match Scoring',     desc: 'Every job is scored 0–100 against your profile. Only 70+ scores reach your dashboard.',           color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950' },
  { icon: Zap,          title: '7 Job Boards at Once', desc: 'Scans RemoteOK, Jobicy, WWR, Working Nomads, Himalayas, Arbeitnow, and Remotive simultaneously.', color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-950' },
  { icon: MailCheck,    title: 'Open Jobs Tracker',    desc: 'Click Apply Now on any match — the job is saved to your Open Jobs tracker automatically.',         color: 'text-green-500',   bg: 'bg-green-50 dark:bg-green-950' },
  { icon: TrendingUp,   title: 'Resume Gap Analysis',  desc: 'After scanning, AI tells you exactly which skills are missing from your resume to improve matches.', color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950' },
  { icon: Shield,       title: 'Private & Secure',     desc: 'Your resume is stored with encryption. Never sold, never shared, always yours.',                   color: 'text-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-950' },
  { icon: CheckSquare,  title: 'Application Tracking', desc: 'See all jobs you\'ve opened in one place. Never lose track of where you applied.',                  color: 'text-teal-500',    bg: 'bg-teal-50 dark:bg-teal-950' },
  { icon: Sparkles,     title: 'AI Resume Suggestions','desc': 'Get GPT-4o feedback on how to improve your resume for the roles you\'re targeting.',              color: 'text-violet-500',  bg: 'bg-violet-50 dark:bg-violet-950' },
]

const stats = [
  { value: '7',      label: 'Job boards scanned'    },
  { value: '40+',   label: 'Jobs per refresh'       },
  { value: 'GPT-4o', label: 'AI engine'              },
  { value: 'Free',   label: 'No credit card needed'  },
]

const platforms = [
  { name: 'RemoteOK',         color: 'bg-cyan-500',     jobs: 'remote' },
  { name: 'Jobicy',           color: 'bg-teal-500',     jobs: 'remote' },
  { name: 'We Work Remotely', color: 'bg-lime-500',     jobs: 'remote' },
  { name: 'Working Nomads',   color: 'bg-sky-500',      jobs: 'remote' },
  { name: 'Himalayas',        color: 'bg-violet-500',   jobs: 'remote' },
  { name: 'Arbeitnow',        color: 'bg-rose-500',     jobs: 'remote' },
  { name: 'Remotive',         color: 'bg-fuchsia-500',  jobs: 'remote' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <BrainCircuit className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">JobMatch AI</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/login" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'hidden sm:inline-flex')}>
              Sign in
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ size: 'sm' }))}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/6 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-20 text-center">
          <Badge variant="secondary" className="mb-5 gap-1.5 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" />Powered by GPT-4o · 7 job boards
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-[1.1]">
            Stop applying blindly.
            <br />
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              Find jobs that fit you.
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Upload your resume once. AI scans <strong className="text-foreground">7 job boards simultaneously</strong> and
            surfaces only the roles where you score 70 or above.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-8 font-semibold w-full sm:w-auto gap-2')}>
              Start for free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 px-8 font-semibold w-full sm:w-auto')}>
              Sign in
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">No credit card · Free to use</p>
        </div>
      </section>

      {/* Platform showcase */}
      <section className="border-y bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-6">
            Jobs sourced from 7 platforms — all free, all remote-focused
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {platforms.map(({ name, color, jobs }) => (
              <div
                key={name}
                className="flex items-center gap-2 bg-background border rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                <span className="text-sm font-semibold">{name}</span>
                <span className="text-xs text-muted-foreground border-l pl-2">{jobs} jobs</span>
              </div>
            ))}
          </div>
       
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
          {stats.map(({ value, label }) => (
            <div key={label}>
              <div className="text-xl sm:text-2xl font-extrabold">{value}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold">How it works</h2>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Four steps from resume to interview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Upload Resume',      desc: 'Drop your PDF. GPT-4o reads your skills, experience, and target roles in seconds.',    icon: FileText },
            { step: '02', title: 'AI Scans 7 Boards',  desc: 'We fetch 40+ jobs from RemoteOK, Jobicy, Arbeitnow, Remotive, WWR and more.',         icon: BrainCircuit },
            { step: '03', title: 'Score & Filter',     desc: 'Every job is scored against your profile. Only 70+ fits land on your dashboard.',      icon: Star },
            { step: '04', title: 'Open & Track',       desc: 'Click any match to view details and open the job. Saved to your tracker automatically.', icon: MailCheck },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div key={step} className="flex flex-col items-center text-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {step.replace('0', '')}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/20 border-y">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold">Everything you need</h2>
            <p className="text-muted-foreground mt-2 text-sm">Built for serious job seekers</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-background rounded-2xl border p-5 hover:shadow-md transition-shadow">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', bg)}>
                  <Icon className={cn('h-4 w-4', color)} />
                </div>
                <h3 className="font-semibold text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="relative bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl px-6 sm:px-12 py-12 sm:py-16 text-center overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
          </div>
          <div className="relative space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to find your next role?</h2>
            <p className="text-slate-300 max-w-lg mx-auto text-sm sm:text-base">
              Upload your resume and get AI-scored matches from 7 job boards — 40+ fresh listings — in under a minute.
            </p>
            {/* Mini platform strip inside CTA */}
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {platforms.map(({ name, color }) => (
                <span key={name} className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 rounded-full px-2.5 py-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
                  {name}
                </span>
              ))}
            </div>
            <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-8 font-semibold bg-white text-slate-900 hover:bg-slate-100 gap-2 mt-2 inline-flex')}>
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BrainCircuit className="h-3.5 w-3.5" />
            <span className="font-semibold">JobMatch AI</span>
          </div>
          <p>Built with Next.js, Supabase &amp; GPT-4o</p>
        </div>
      </footer>
    </div>
  )
}
