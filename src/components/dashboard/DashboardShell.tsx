'use client'

import { useState } from 'react'
import { LayoutDashboard, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardOverview } from './DashboardOverview'
import { JobMatchesList } from './JobMatchesList'
import type { JobMatchWithListing } from '@/types/database'

interface Props {
  firstName: string | null
  insights: { skills: unknown; target_roles: unknown; summary: unknown; experience_years: unknown; keywords: unknown } | null
  initialMatches: JobMatchWithListing[]
}

const TABS = [
  { key: 'overview', label: 'Dashboard', icon: LayoutDashboard, desc: 'Stats & insights' },
  { key: 'jobs',     label: 'Jobs',      icon: Briefcase,        desc: 'Your matches'   },
] as const
type Tab = 'overview' | 'jobs'

export function DashboardShell({ firstName, insights, initialMatches }: Props) {
  const [tab, setTab] = useState<Tab>('overview')
  // Lifted state — updated by JobMatchesList after refresh so sidebar badge stays in sync
  const [matches, setMatches] = useState<JobMatchWithListing[]>(initialMatches)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row gap-6 items-start">
      {/* ── Sidebar ── */}
      <aside className="w-full sm:w-52 shrink-0 sm:sticky sm:top-20">
        {/* Mobile pill tabs */}
        <div className="flex sm:hidden gap-1 bg-muted rounded-xl p-1 mb-4">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as Tab)}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all',
                tab === key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Desktop vertical nav */}
        <nav className="hidden sm:flex flex-col gap-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
            Navigation
          </p>
          {TABS.map(({ key, label, icon: Icon, desc }) => (
            <button key={key} onClick={() => setTab(key as Tab)}
              className={cn('group w-full flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-all',
                tab === key ? 'bg-background shadow-sm border text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                tab === key ? 'bg-primary/10' : 'bg-muted-foreground/10 group-hover:bg-muted-foreground/15')}>
                <Icon className={cn('h-4 w-4', tab === key ? 'text-primary' : '')} />
              </div>
              <div className="pt-0.5 flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none">{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
              {/* Live badge — updates whenever JobMatchesList refreshes */}
              {key === 'jobs' && matches.length > 0 && (
                <span className="ml-auto shrink-0 text-xs font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {matches.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
        {tab === 'overview' && (
          <DashboardOverview
            firstName={firstName}
            insights={insights}
            matches={matches}
            onGoToJobs={() => setTab('jobs')}
          />
        )}
        {tab === 'jobs' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Job Matches</h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                All roles scored 70+ against your resume
              </p>
            </div>
            <JobMatchesList
              initialMatches={matches}
              onMatchesUpdate={setMatches}
            />
          </div>
        )}
      </div>
    </div>
  )
}
