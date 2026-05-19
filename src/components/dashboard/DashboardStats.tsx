import { Briefcase, Star, Globe2, Zap } from 'lucide-react'

interface DashboardStatsProps {
  matchCount: number
  topScore: number | null
  platforms: string[]
  targetRoles: string[]
  experienceYears: number | null
}

const PLATFORM_LABELS: Record<string, string> = {
  remoteok: 'RemoteOK', jobicy: 'Jobicy', linkedin: 'LinkedIn',
  indeed: 'Indeed', glassdoor: 'Glassdoor', ziprecruiter: 'ZipRecruiter',
}

export function DashboardStats({ matchCount, topScore, platforms, targetRoles, experienceYears }: DashboardStatsProps) {
  const stats = [
    {
      icon: Briefcase,
      label: 'Jobs matched',
      value: matchCount > 0 ? matchCount.toString() : '—',
      sub: matchCount > 0 ? 'scored 70 or above' : 'hit Refresh to scan',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      icon: Star,
      label: 'Best score',
      value: topScore ? `${topScore}%` : '—',
      sub: topScore && topScore >= 90 ? 'Top match 🎉' : topScore ? 'Good fit' : 'No scans yet',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      icon: Globe2,
      label: 'Sources',
      value: platforms.length > 0 ? platforms.length.toString() : '4',
      sub: platforms.length > 0
        ? platforms.map(p => PLATFORM_LABELS[p] ?? p).join(', ')
        : 'RemoteOK, Jobicy + more',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Zap,
      label: 'Experience',
      value: experienceYears ? `${experienceYears}y` : '—',
      sub: targetRoles.length > 0 ? targetRoles.slice(0, 2).join(' · ') : 'Complete onboarding',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value, sub, color, bg }) => (
        <div key={label} className="bg-background rounded-2xl border p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
          <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5 truncate" title={sub}>{sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
