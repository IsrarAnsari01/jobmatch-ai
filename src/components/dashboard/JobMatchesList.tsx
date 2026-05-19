'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Building2, MapPin, Loader2, RefreshCw,
  Star, CheckCircle2, Briefcase, Filter, TrendingUp, ChevronRight
} from 'lucide-react'
import { JobMatchWithListing } from '@/types/database'
import { JobDetailSheet } from './JobDetailSheet'
import { ScrapeProgress } from './ScrapeProgress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ─── Date filter options ──────────────────────────────────────────────────────
const DATE_FILTERS = [
  { label: '15 minutes', ms: 15 * 60 * 1000 },
  { label: '30 minutes', ms: 30 * 60 * 1000 },
  { label: '1 hour',     ms: 60 * 60 * 1000 },
  { label: '3 hours',    ms: 3 * 60 * 60 * 1000 },
  { label: '6 hours',    ms: 6 * 60 * 60 * 1000 },
  { label: '12 hours',   ms: 12 * 60 * 60 * 1000 },
  { label: '24 hours',   ms: 24 * 60 * 60 * 1000 },
  { label: '3 days',     ms: 3 * 24 * 60 * 60 * 1000 },   // default
  { label: '1 week',     ms: 7 * 24 * 60 * 60 * 1000 },
  { label: '2 weeks',    ms: 14 * 24 * 60 * 60 * 1000 },
  { label: '1 month',    ms: 30 * 24 * 60 * 60 * 1000 },
]
const DEFAULT_SINCE_MS    = 3 * 24 * 60 * 60 * 1000   // 3 days
const DEFAULT_DATE_LABEL  = '3 days'
const DATE_LABEL_TO_MS    = Object.fromEntries(DATE_FILTERS.map(f => [f.label, f.ms]))

interface JobMatchesListProps {
  initialMatches: JobMatchWithListing[]
  onMatchesUpdate?: (matches: JobMatchWithListing[]) => void
  /** Called when a scrape finishes with background jobs still running — arg is current match count */
  onBgScrapeStarted?: (knownCount: number) => void
}

const PLATFORM_STYLES: Record<string, { label: string; class: string }> = {
  linkedin:       { label: 'LinkedIn',      class: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  indeed:         { label: 'Indeed',        class: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  glassdoor:      { label: 'Glassdoor',     class: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-950 dark:text-green-300 dark:border-green-800' },
  ziprecruiter:   { label: 'ZipRecruiter',  class: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' },
  remoteok:       { label: 'RemoteOK',      class: 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800' },
  jobicy:         { label: 'Jobicy',        class: 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800' },
  weworkremotely: { label: 'WWR',           class: 'bg-lime-50 text-lime-700 border-lime-100 dark:bg-lime-950 dark:text-lime-300 dark:border-lime-800' },
  workingnomads:  { label: 'WorkNomads',    class: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' },
  himalayas:      { label: 'Himalayas',     class: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800' },
}

type FilterTier = 'all' | 'top' | 'good' | 'partial'
interface DebugInfo { scraped: number; scored: number; passed: number; background: number }

function ScoreRing({ score }: { score: number }) {
  const r = 20, circ = 2 * Math.PI * r
  const color = score >= 90 ? '#10b981' : score >= 80 ? '#14b8a6' : '#f59e0b'
  const label = score >= 90 ? 'Top' : score >= 80 ? 'Good' : 'Fair'
  return (
    <div className="relative shrink-0 w-12 h-12 flex items-center justify-center">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/40" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[10px] font-bold leading-none" style={{ color }}>{score}</span>
        <span className="text-[8px] text-muted-foreground leading-none mt-0.5">{label}</span>
      </div>
    </div>
  )
}

export function JobMatchesList({ initialMatches, onMatchesUpdate, onBgScrapeStarted }: JobMatchesListProps) {
  const [matches, setMatches] = useState<JobMatchWithListing[]>(initialMatches)
  const [scraping, setScraping] = useState(false)
  const [filter, setFilter] = useState<FilterTier>('all')
  const [dateLabel, setDateLabel] = useState(DEFAULT_DATE_LABEL)
  const sinceMs = DATE_LABEL_TO_MS[dateLabel] ?? DEFAULT_SINCE_MS
  const [lastDebug, setLastDebug] = useState<DebugInfo | null>(null)
  const [progressResult, setProgressResult] = useState<DebugInfo | null>(null)
  const [selected, setSelected] = useState<JobMatchWithListing | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  function updateMatches(m: JobMatchWithListing[]) {
    setMatches(m)
    onMatchesUpdate?.(m)
  }

  const filtered = useMemo(() => {
    const f = { top: [90, 101], good: [80, 90], partial: [70, 80] }
    if (filter === 'all') return matches
    const [min, max] = f[filter]
    return matches.filter(m => m.score >= min && m.score < max)
  }, [matches, filter])

  const counts = useMemo(() => ({
    all: matches.length,
    top: matches.filter(m => m.score >= 90).length,
    good: matches.filter(m => m.score >= 80 && m.score < 90).length,
    partial: matches.filter(m => m.score >= 70 && m.score < 80).length,
  }), [matches])

  function openDetail(match: JobMatchWithListing) {
    setSelected(match)
    setSheetOpen(true)
  }

  async function handleRefresh() {
    setScraping(true)
    setLastDebug(null)
    setProgressResult(null)

    try {
      const res = await fetch('/api/jobs/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sinceMs }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Failed to scan')
        return
      }

      const debug: DebugInfo = {
        scraped: data.debug?.scraped ?? 0,
        scored: data.debug?.scored ?? 0,
        passed: data.debug?.passed ?? 0,
        background: data.debug?.background ?? 0,
      }

      setProgressResult(debug)
      setLastDebug(debug)
      updateMatches(data.matches ?? [])

      // Brief pause so user sees the success state
      await new Promise(r => setTimeout(r, 1800))

      const matchCount = data.matches?.length ?? 0
      if (matchCount === 0) {
        toast.warning(debug.scraped
          ? `Scanned ${debug.scraped} jobs — none scored 70+ this time. Try refreshing again.`
          : 'No jobs found right now. Try again soon.'
        )
      } else {
        const bg = debug.background ?? 0
        toast.success(
          `${matchCount} job${matchCount !== 1 ? 's' : ''} matched!`,
          { description: bg > 0 ? `Scoring ${bg} more in background — list will update automatically.` : undefined }
        )
        // Delegate polling to the shell so it works on any tab
        if (bg > 0) onBgScrapeStarted?.(matchCount)
      }
    } catch {
      toast.error('Scan failed. Check your connection.')
    } finally {
      setScraping(false)
      // Clear progress card after a short delay
      setTimeout(() => setProgressResult(null), 3000)
    }
  }

  const plt = (p: string) =>
    PLATFORM_STYLES[p] ?? { label: p.charAt(0).toUpperCase() + p.slice(1), class: 'bg-muted text-muted-foreground border-border' }

  const filterTabs: { key: FilterTier; label: string; dot?: string }[] = [
    { key: 'all',     label: `All (${counts.all})` },
    { key: 'top',     label: `Top 90+ (${counts.top})`,      dot: 'bg-emerald-500' },
    { key: 'good',    label: `Good 80+ (${counts.good})`,    dot: 'bg-teal-500' },
    { key: 'partial', label: `Fair 70+ (${counts.partial})`, dot: 'bg-amber-500' },
  ]

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="space-y-2.5">
          {/* Row 1: score filter tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {filterTabs.map(({ key, label, dot }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  filter === key
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                }`}
              >
                {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
                {label}
              </button>
            ))}
          </div>

          {/* Row 2: date filter + refresh */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            {/* Date posted dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Posted within</span>
              <Select value={dateLabel} onValueChange={v => v && setDateLabel(v)}>
                <SelectTrigger className="h-8 text-xs w-36 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FILTERS.map(({ label }) => (
                    <SelectItem key={label} value={label} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleRefresh}
              disabled={scraping}
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 shrink-0 w-full sm:w-auto"
            >
              {scraping
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Scanning...</>
                : <><RefreshCw className="h-3.5 w-3.5" />Refresh jobs</>
              }
            </Button>
          </div>
          </div>
        </div>

        {/* ── Progress card (shown during + briefly after scrape) ── */}
        {(scraping || progressResult) && (
          <ScrapeProgress active={scraping} result={progressResult} />
        )}

        {/* Scan stats line */}
        {!scraping && !progressResult && lastDebug && lastDebug.scraped > 0 && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Last scan: <b className="text-foreground">{lastDebug.scraped}</b> fetched ·{' '}
            <b className="text-foreground">{lastDebug.scored}</b> scored ·{' '}
            <b className="text-foreground">{lastDebug.passed}</b> matched
            {lastDebug.background > 0 && <span className="text-muted-foreground/60">· {lastDebug.background} processing in background</span>}
          </p>
        )}

        {/* Empty state */}
        {!scraping && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 px-6 text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <Briefcase className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{matches.length > 0 ? 'No jobs in this tier' : 'No matches yet'}</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
                {matches.length > 0
                  ? 'Try a different filter above.'
                  : 'Hit Refresh to scan 5 job boards for roles that fit your profile.'}
              </p>
            </div>
            {matches.length === 0 && (
              <Button onClick={handleRefresh} disabled={scraping} className="gap-1.5">
                <RefreshCw className="h-4 w-4" />Scan for jobs
              </Button>
            )}
          </div>
        )}

        {/* Job cards */}
        {!scraping && filtered.map((match) => {
          const job = match.job_listings
          const p = plt(job.platform)
          return (
            <button
              key={match.id}
              onClick={() => openDetail(match)}
              className="group w-full text-left bg-card rounded-2xl border hover:border-primary/30 hover:shadow-md active:scale-[0.99] transition-all duration-200 overflow-hidden cursor-pointer"
            >
              <div className={`h-0.5 w-full ${
                match.score >= 90 ? 'bg-gradient-to-r from-emerald-400 to-green-500' :
                match.score >= 80 ? 'bg-gradient-to-r from-teal-400 to-cyan-500' :
                'bg-gradient-to-r from-amber-400 to-yellow-500'
              }`} />

              <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <ScoreRing score={match.score} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm sm:text-base leading-snug">{job.title}</h3>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />{job.company}
                      </span>
                      {job.location && (
                        <span className="hidden sm:flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />{job.location}
                        </span>
                      )}
                      <span className={`inline-flex items-center text-xs border px-2 py-0.5 rounded-full font-medium ${p.class}`}>
                        {p.label}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {match.match_reasons?.length > 0 && (
                  <div className="mt-2.5 flex flex-col gap-1">
                    {match.match_reasons.slice(0, 2).map((reason, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{match.score}% match
                  </span>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                    View details <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </button>
          )
        })}

        {!scraping && matches.length > 0 && (
          <p className="text-center text-xs text-muted-foreground pt-1">
            {matches.length} match{matches.length !== 1 ? 'es' : ''} · click Refresh for fresh results
          </p>
        )}
      </div>

      <JobDetailSheet match={selected} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}
