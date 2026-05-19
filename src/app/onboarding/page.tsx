import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from '@/components/onboarding/OnboardingForm'
import { BrainCircuit } from 'lucide-react'
import Link from 'next/link'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) redirect('/dashboard')

  const firstName = profile?.full_name?.split(' ')[0] ?? null

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-background/80 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <BrainCircuit className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">JobMatch AI</span>
        </Link>
        <div className="text-xs text-muted-foreground">Step 1 of 1</div>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-10 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BrainCircuit className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Upload your resume and our AI will extract your skills and find
            jobs that are a perfect fit — scored 90+.
          </p>
        </div>

        <OnboardingForm userId={user.id} />
      </div>
    </div>
  )
}
