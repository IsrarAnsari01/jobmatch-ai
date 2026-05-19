'use client'

import { useState, useRef, useCallback } from 'react'
import { LayoutDashboard, Briefcase, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardOverview } from './DashboardOverview'
import { JobMatchesList } from './JobMatchesList'
import { BgScrapeAlert } from './BgScrapeAlert'
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
  const [matches, setMatches] = useState<JobMatchWithListing[]>(initialMatches)
  const [bgPolling, setBgPolling] = useState(false)
  const [bgNewMatches, setBgNewMatches] = useState<JobMatchWithListing[] | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    setBgPolling(false)
  }, [])

  /** Call this after any scrape that returned background > 0 */
  const startBackgroundPolling = useCallback((knownCount: number) => {
    stopPolling()
    setBgPolling(true)
    setBgNewMatches(null)
    let attempts = 0
    const MAX = 18   // 18 × 5 s = 90 s

    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > MAX) { stopPolling(); return }

      try {
        const res = await fetch('/api/jobs/scrape', { method: 'GET' })
        if (!res.ok) return
        const data = await res.json()
        const fresh: JobMatchWithListing[] = data.matches ?? []

        if (fresh.length > knownCount) {
          const added = fresh.slice(knownCount)   // only the newly added ones
          stopPolling()
          setMatches(fresh)
          setBgNewMatches(added)
        }
      } catch { /* silent */ }
    }, 5000)
  }, [stopPolling])

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
              {/* Badge — jobs count + pulsing bg indicator */}
              {key === 'jobs' && (
                <div className="flex items-center gap-1">
                  {bgPolling && (
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  )}
                  {matches.length > 0 && (
                    <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {matches.length}
                    </span>
                  )}
                </div>
              )}
            </button>
          ))}

          {/* Global bg polling indicator */}
          {bgPolling && (
            <div className="mt-2 mx-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping shrink-0" />
              Scoring more jobs…
            </div>
          )}
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

            {/* Persistent background-scoring indicator */}
            <BgScrapeAlert
              active={bgPolling}
              newMatches={bgNewMatches}
              onDismiss={() => setBgNewMatches(null)}
            />

            <JobMatchesList
              initialMatches={matches}
              onMatchesUpdate={setMatches}
              onBgScrapeStarted={startBackgroundPolling}
            />
          </div>
        )}
      </div>
    </div>
  )
}
