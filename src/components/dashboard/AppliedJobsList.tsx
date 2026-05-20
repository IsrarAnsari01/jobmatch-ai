'use client'

import { useState, useEffect } from 'react'
import { Building2, MapPin, ExternalLink, CheckCircle2, Calendar, Globe2, Send, Loader2 } from 'lucide-react'

interface AppliedJob {
  id: string
  sent_at: string
  status: string
  job_listings: {
    id: string
    title: string
    company: string
    location: string | null
    url: string
    platform: string
    description: string
  }
}

const PLATFORM_LABELS: Record<string, string> = {
  remoteok: 'RemoteOK', jobicy: 'Jobicy', weworkremotely: 'WWR',
  workingnomads: 'WorkNomads', himalayas: 'Himalayas',
  linkedin: 'LinkedIn', indeed: 'Indeed', glassdoor: 'Glassdoor',
}

export function AppliedJobsList({ appliedIds }: { appliedIds: Set<string> }) {
  const [jobs, setJobs] = useState<AppliedJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/jobs/apply')
      .then(r => r.json())
      .then(d => setJobs(d.applications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [appliedIds]) // re-fetch whenever appliedIds changes

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <Send className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">No open jobs yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
            Open any job from the Jobs tab and click <strong>Apply Now</strong> to save it here for tracking.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{jobs.length}</span> application{jobs.length !== 1 ? 's' : ''} tracked
      </p>

      {jobs.map(app => {
        const job = app.job_listings
        const platformLabel = PLATFORM_LABELS[job.platform] ?? job.platform
        const appliedDate = new Date(app.sent_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
        })

        return (
          <div
            key={app.id}
            className="group bg-card rounded-2xl border hover:border-primary/20 hover:shadow-sm transition-all duration-200 overflow-hidden"
          >
            {/* Top accent */}
            <div className="h-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 w-full" />

            <div className="p-4 sm:p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm sm:text-base leading-snug">{job.title}</h3>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />Applied
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                      {job.company}
                    </span>
                    {job.location && (
                      <span className="hidden sm:flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />{job.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Globe2 className="h-3 w-3 shrink-0" />
                      {platformLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {appliedDate}
                    </span>
                  </div>
                </div>

                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 flex items-center gap-1.5 text-xs font-medium border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">View Job</span>
                </a>
              </div>

              {/* Description snippet */}
              <p className="mt-2.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {job.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
