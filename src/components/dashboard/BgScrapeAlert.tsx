'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, Sparkles, X } from 'lucide-react'
import type { JobMatchWithListing } from '@/types/database'

interface BgScrapeAlertProps {
  active: boolean
  /** Pass the new matches when background completes */
  newMatches: JobMatchWithListing[] | null
  onDismiss: () => void
}

export function BgScrapeAlert({ active, newMatches, onDismiss }: BgScrapeAlertProps) {
  const [visible, setVisible] = useState(false)
  const [dots, setDots] = useState('.')

  useEffect(() => {
    if (active) setVisible(true)
  }, [active])

  // Dismiss automatically 5s after new matches arrive
  useEffect(() => {
    if (newMatches && !active) {
      const t = setTimeout(() => { setVisible(false); onDismiss() }, 5000)
      return () => clearTimeout(t)
    }
  }, [newMatches, active, onDismiss])

  // Animated ellipsis while loading
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 500)
    return () => clearInterval(id)
  }, [active])

  if (!visible) return null

  const isDone = !!newMatches && !active

  return (
    <div
      className={`relative flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all duration-300 ${
        isDone
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900'
          : 'bg-primary/5 border-primary/20'
      }`}
    >
      {/* Icon */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
        isDone ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-primary/10'
      }`}>
        {isDone
          ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          : <Loader2 className="h-4 w-4 text-primary animate-spin" />
        }
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        {isDone ? (
          <>
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">
              +{newMatches.length} new job{newMatches.length !== 1 ? 's' : ''} added!
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 ml-1.5">
              Background scoring complete — list updated.
            </span>
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Scoring more jobs in background{dots}
            </span>
            <span className="text-muted-foreground ml-0.5 text-xs">
              &nbsp;List will update automatically when done.
            </span>
          </>
        )}
      </div>

      {/* Dismiss — only when done */}
      {isDone && (
        <button
          onClick={() => { setVisible(false); onDismiss() }}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
