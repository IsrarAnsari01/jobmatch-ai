'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { Star, Briefcase, Globe2, TrendingUp, ArrowRight, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GapAnalysis } from './GapAnalysis'
import type { JobMatchWithListing } from '@/types/database'
import { cn } from '@/lib/utils'

interface Props {
  firstName: string | null
  insights: { skills: unknown; target_roles: unknown; summary: unknown; experience_years: unknown } | null
  matches: JobMatchWithListing[]
  onGoToJobs: () => void
}

const PLATFORM_LABELS: Record<string, string> = {
  remoteok: 'RemoteOK', jobicy: 'Jobicy', weworkremotely: 'WWR',
  workingnomads: 'WorkNomads', himalayas: 'Himalayas',
  linkedin: 'LinkedIn', indeed: 'Indeed', glassdoor: 'Glassdoor',
}

const PLATFORM_COLORS: Record<string, string> = {
  remoteok: '#06b6d4', jobicy: '#14b8a6', weworkremotely: '#84cc16',
  workingnomads: '#0ea5e9', himalayas: '#8b5cf6',
  linkedin: '#3b82f6', indeed: '#a855f7', glassdoor: '#22c55e',
}

const TIER_COLORS = ['#10b981', '#14b8a6', '#f59e0b']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} job{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

export function DashboardOverview({ firstName, insights, matches, onGoToJobs }: Props) {
  const skills = (insights?.skills as string[]) ?? []
  const targetRoles = (insights?.target_roles as string[]) ?? []

  const stats = useMemo(() => ({
    total:   matches.length,
    topScore: matches.length ? Math.max(...matches.map(m => m.score)) : 0,
    avgScore: matches.length ? Math.round(matches.reduce((s, m) => s + m.score, 0) / matches.length) : 0,
    top90:   matches.filter(m => m.score >= 90).length,
  }), [matches])

  // Score distribution chart (buckets: 70-74, 75-79, 80-84, 85-89, 90-94, 95+)
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { label: '70–74', min: 70, max: 75 },
      { label: '75–79', min: 75, max: 80 },
      { label: '80–84', min: 80, max: 85 },
      { label: '85–89', min: 85, max: 90 },
      { label: '90–94', min: 90, max: 95 },
      { label: '95+',   min: 95, max: 101 },
    ]
    return buckets.map(b => ({
      label: b.label,
      count: matches.filter(m => m.score >= b.min && m.score < b.max).length,
      color: b.min >= 90 ? '#10b981' : b.min >= 80 ? '#14b8a6' : '#f59e0b',
    }))
  }, [matches])

  // Platform distribution
  const platformData = useMemo(() => {
    const counts: Record<string, number> = {}
    matches.forEach(m => {
      const p = m.job_listings.platform
      counts[p] = (counts[p] ?? 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([platform, count]) => ({
        name: PLATFORM_LABELS[platform] ?? platform,
        value: count,
        color: PLATFORM_COLORS[platform] ?? '#94a3b8',
      }))
  }, [matches])

  // Tier breakdown
  const tierData = useMemo(() => [
    { label: 'Top 90+',  count: matches.filter(m => m.score >= 90).length },
    { label: 'Good 80+', count: matches.filter(m => m.score >= 80 && m.score < 90).length },
    { label: 'Fair 70+', count: matches.filter(m => m.score >= 70 && m.score < 80).length },
  ], [matches])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          {greeting}{firstName ? `, ${firstName}` : ''}! 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {matches.length > 0
            ? `You have ${matches.length} job match${matches.length !== 1 ? 'es' : ''} — ${stats.top90} score 90 or above.`
            : 'Go to Jobs tab and hit Refresh to scan for your first matches.'}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Briefcase,  label: 'Total Matches', value: stats.total > 0 ? stats.total : '—',    sub: 'scored 70+',            color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
          { icon: Star,       label: 'Best Score',    value: stats.topScore > 0 ? `${stats.topScore}%` : '—', sub: stats.topScore >= 90 ? '🎉 Top match!' : 'Your top job',  color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950' },
          { icon: TrendingUp, label: 'Avg Score',     value: stats.avgScore > 0 ? `${stats.avgScore}%` : '—', sub: 'across all matches', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
          { icon: Globe2,     label: 'Top 90+',       value: stats.top90 > 0 ? stats.top90 : '—',    sub: 'excellent fits',        color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950' },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-card rounded-2xl border p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {matches.length > 0 ? (
        <>
          {/* Charts row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Score distribution */}
            <div className="bg-card rounded-2xl border p-5 space-y-3">
              <div>
                <p className="font-semibold text-sm">Score Distribution</p>
                <p className="text-xs text-muted-foreground">Jobs by match score range</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={scoreDistribution} barCategoryGap="25%">
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {scoreDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={entry.count === 0 ? 0.2 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Platform breakdown */}
            <div className="bg-card rounded-2xl border p-5 space-y-3">
              <div>
                <p className="font-semibold text-sm">Job Sources</p>
                <p className="text-xs text-muted-foreground">Where your matches come from</p>
              </div>
              {platformData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <PieChart width={100} height={100}>
                    <Pie data={platformData} cx={45} cy={45} innerRadius={28} outerRadius={45} dataKey="value" paddingAngle={2}>
                      {platformData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="flex-1 space-y-1.5">
                    {platformData.map(({ name, value, color }) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-xs flex-1 truncate">{name}</span>
                        <span className="text-xs font-semibold text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">No data yet</div>
              )}
            </div>
          </div>

          {/* Tier breakdown */}
          <div className="bg-card rounded-2xl border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Match Tiers</p>
                <p className="text-xs text-muted-foreground">How your matches are distributed</p>
              </div>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onGoToJobs}>
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-2.5">
              {tierData.map(({ label, count }, i) => (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TIER_COLORS[i] }} />
                      {label}
                    </span>
                    <span className="font-semibold">{count} job{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%',
                        backgroundColor: TIER_COLORS[i],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Target roles */}
          {targetRoles.length > 0 && (
            <div className="bg-card rounded-2xl border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Your Target Roles</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {targetRoles.map(r => (
                  <span key={r} className="inline-flex items-center gap-1 text-xs bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium">
                    <Sparkles className="h-2.5 w-2.5" />{r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Gap analysis */}
          <GapAnalysis />
        </>
      ) : (
        /* Empty state */
        <div className="bg-card rounded-2xl border-2 border-dashed p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Zap className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">No matches yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Go to the Jobs tab and click Refresh to scan 5 job boards and score matches against your resume.
            </p>
          </div>
          <Button onClick={onGoToJobs} className="gap-1.5">
            <Briefcase className="h-4 w-4" />
            Go to Jobs
          </Button>
        </div>
      )}
    </div>
  )
}
