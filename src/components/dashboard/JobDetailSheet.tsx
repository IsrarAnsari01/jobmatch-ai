'use client'

import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Building2, MapPin, ExternalLink, CheckCircle2,
  Star, Globe2, ArrowUpRight, Briefcase
} from 'lucide-react'
import { JobMatchWithListing } from '@/types/database'

interface JobDetailSheetProps {
  match: JobMatchWithListing | null
  open: boolean
  onClose: () => void
}

const PLATFORM_STYLES: Record<string, { label: string; class: string }> = {
  linkedin:     { label: 'LinkedIn',     class: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  indeed:       { label: 'Indeed',       class: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  glassdoor:    { label: 'Glassdoor',    class: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' },
  ziprecruiter: { label: 'ZipRecruiter', class: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' },
  remoteok:       { label: 'RemoteOK',      class: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800' },
  jobicy:         { label: 'Jobicy',        class: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800' },
  weworkremotely: { label: 'We Work Remotely', class: 'bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950 dark:text-lime-300 dark:border-lime-800' },
  workingnomads:  { label: 'Working Nomads',   class: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800' },
  himalayas:      { label: 'Himalayas',        class: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800' },
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 80 ? 'bg-teal-500' : 'bg-amber-500'
  const label = score >= 90 ? 'Top Match' : score >= 80 ? 'Good Match' : 'Partial Match'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold flex items-center gap-1.5">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          Match Score
        </span>
        <span className="font-bold">{score}% · {label}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export function JobDetailSheet({ match, open, onClose }: JobDetailSheetProps) {
  if (!match) return null
  const job = match.job_listings
  const plt = PLATFORM_STYLES[job.platform] ?? {
    label: job.platform,
    class: 'bg-muted text-muted-foreground border-border',
  }

  // Format description into paragraphs
  const paragraphs = (job.description ?? '')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .slice(0, 12)

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        className="w-full sm:w-[520px] sm:max-w-[520px] flex flex-col p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-bold leading-tight">{job.title}</SheetTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />{job.company}
                </span>
                {job.location && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />{job.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Score bar */}
          <ScoreBar score={match.score} />

          {/* Match reasons */}
          {match.match_reasons?.length > 0 && (
            <div className="rounded-xl bg-muted/50 border p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Why you match</p>
              {match.match_reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/30 border p-3">
              <p className="text-xs text-muted-foreground mb-1">Platform</p>
              <span className={`inline-flex items-center gap-1 text-xs border px-2 py-0.5 rounded-full font-semibold ${plt.class}`}>
                <Globe2 className="h-3 w-3" />
                {plt.label}
              </span>
            </div>
            <div className="rounded-xl bg-muted/30 border p-3">
              <p className="text-xs text-muted-foreground mb-1">Location</p>
              <p className="text-sm font-medium">{job.location || 'Remote'}</p>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Description</p>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky footer CTA */}
        <div className="px-5 py-4 border-t bg-background shrink-0">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            View Job & Apply
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Opens on {plt.label} · apply directly there
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
