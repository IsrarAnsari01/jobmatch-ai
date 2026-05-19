'use client'

import { useState } from 'react'
import { User, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProfileSection } from './ProfileSection'
import { ResumeSection } from './ResumeSection'
import type { Profile, ResumeInsights } from '@/types/database'

interface Props {
  user: { id: string; email: string }
  profile: Profile | null
  insights: ResumeInsights | null
}

const TABS = [
  { key: 'profile', label: 'Profile',          icon: User,     desc: 'Personal info & skills' },
  { key: 'resume',  label: 'Resume Analysis',  icon: FileText, desc: 'Insights & suggestions' },
] as const

type Tab = typeof TABS[number]['key']

export function ProfileShell({ user, profile, insights }: Props) {
  const [active, setActive] = useState<Tab>('profile')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile and resume</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
        {/* ── Sidebar (desktop) / Tabs (mobile) ── */}
        <aside className="w-full sm:w-52 shrink-0">
          {/* Mobile: horizontal pill tabs */}
          <div className="flex sm:hidden gap-1 bg-muted rounded-xl p-1 mb-4">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all',
                  active === key
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Desktop: vertical nav */}
          <nav className="hidden sm:flex flex-col gap-1">
            {TABS.map(({ key, label, icon: Icon, desc }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={cn(
                  'group w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all',
                  active === key
                    ? 'bg-primary/8 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                  active === key ? 'bg-primary/15' : 'bg-muted group-hover:bg-muted-foreground/10'
                )}>
                  <Icon className={cn('h-4 w-4', active === key ? 'text-primary' : '')} />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold leading-none">{label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{desc}</p>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 space-y-5">
          {active === 'profile' && (
            <ProfileSection user={user} profile={profile} insights={insights} />
          )}
          {active === 'resume' && (
            <ResumeSection insights={insights} userId={user.id} />
          )}
        </main>
      </div>
    </div>
  )
}
