'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, Globe2, Brain, Sparkles } from 'lucide-react'

interface ScrapeProgressProps {
  active: boolean
  /** Call with final counts once API responds */
  result: { scraped: number; scored: number; passed: number; background: number } | null
}

const SOURCES = [
  { label: 'RemoteOK',       color: 'bg-cyan-500' },
  { label: 'Jobicy',         color: 'bg-teal-500' },
  { label: 'WWR',            color: 'bg-lime-500' },
  { label: 'WorkNomads',     color: 'bg-sky-500' },
  { label: 'Himalayas',      color: 'bg-violet-500' },
  { label: 'Arbeitnow',      color: 'bg-rose-500' },
  { label: 'Remotive',       color: 'bg-fuchsia-500' },
]

const PHASES = [
  { id: 'fetch',  icon: Globe2,   label: 'Connecting to job boards',     subMs: 0 },
  { id: 'pull',   icon: Globe2,   label: 'Pulling live job listings',    subMs: 1800 },
  { id: 'score',  icon: Brain,    label: 'Scoring matches with GPT-4o',  subMs: 4500 },
  { id: 'done',   icon: Sparkles, label: 'Finalising your matches',      subMs: 99999 },
]

export function ScrapeProgress({ active, result }: ScrapeProgressProps) {
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [visibleSources, setVisibleSources] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [scoredCount, setScoredCount] = useState(0)

  // Reset when a new scrape starts
  useEffect(() => {
    if (!active) { setPhaseIdx(0); setVisibleSources(0); setElapsed(0); setScoredCount(0); return }

    const start = Date.now()
    const tick = setInterval(() => {
      const ms = Date.now() - start
      setElapsed(ms)

      // advance phases
      const nextPhase = PHASES.findLastIndex(p => ms >= p.subMs)
      setPhaseIdx(Math.min(nextPhase, PHASES.length - 2)) // don't go to 'done' until result arrives

      // reveal source badges one by one
      setVisibleSources(Math.min(SOURCES.length, Math.floor(ms / 600) + 1))

      // animate scored counter during scoring phase
      if (ms >= 4500) {
        const fake = Math.min(45, Math.floor((ms - 4500) / 300))
        setScoredCount(fake)
      }
    }, 100)

    return () => clearInterval(tick)
  }, [active])

  // When result arrives, snap to final numbers
  useEffect(() => {
    if (result) {
      setPhaseIdx(PHASES.length - 1)
      setScoredCount(result.scored)
      setVisibleSources(SOURCES.length)
    }
  }, [result])

  if (!active && !result) return null

  const isDone = !!result
  const phase = PHASES[Math.min(phaseIdx, PHASES.length - 1)]

  // Pseudo-progress: fast early, slow near end until result
  const pct = isDone ? 100
    : Math.min(90, elapsed < 2000 ? elapsed / 2000 * 25
      : elapsed < 5000 ? 25 + (elapsed - 2000) / 3000 * 35
      : 60 + (elapsed - 5000) / 15000 * 30)

  return (
    <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
      {/* Progress bar */}
      <div className="h-1 bg-muted w-full">
        <div
          className={`h-full transition-all duration-500 ease-out ${isDone ? 'bg-emerald-500' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="p-5 space-y-4">
        {/* Current phase */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-primary/10'}`}>
            {isDone
              ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              : <Loader2 className="h-5 w-5 text-primary animate-spin" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {isDone ? `Found ${result.passed} matching job${result.passed !== 1 ? 's' : ''}!` : phase.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isDone
                ? `Scanned ${result.scraped} listings · scored ${result.scored}${result.background > 0 ? ` · ${result.background} more scoring in background` : ''}`
                : phaseIdx >= 2
                  ? `${scoredCount} jobs scored so far…`
                  : 'Please wait, fetching fresh listings…'}
            </p>
          </div>
          <span className="text-xs font-bold text-muted-foreground tabular-nums shrink-0">
            {Math.round(pct)}%
          </span>
        </div>

        {/* Source badges */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Job boards</p>
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map((src, i) => {
              const visible = i < visibleSources
              const done = isDone || (visible && phaseIdx >= 2)
              return (
                <span
                  key={src.label}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium transition-all duration-300 ${
                    visible
                      ? done
                        ? 'bg-muted border-border text-muted-foreground'
                        : 'bg-background border-primary/30 text-foreground'
                      : 'bg-muted/30 border-border/30 text-muted-foreground/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${visible ? src.color : 'bg-muted-foreground/20'} ${!done && visible ? 'animate-pulse' : ''}`} />
                  {src.label}
                  {done && visible && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />}
                </span>
              )
            })}
          </div>
        </div>

        {/* Phase steps */}
        <div className="flex items-center gap-1">
          {PHASES.slice(0, 3).map((p, i) => {
            const done = isDone || phaseIdx > i
            const active2 = !isDone && phaseIdx === i
            return (
              <div key={p.id} className="flex items-center gap-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                  done ? 'bg-emerald-500' : active2 ? 'bg-primary' : 'bg-muted'
                }`}>
                  {done
                    ? <CheckCircle2 className="h-3 w-3 text-white" />
                    : active2
                      ? <Loader2 className="h-2.5 w-2.5 text-white animate-spin" />
                      : <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  }
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${done || active2 ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                  {p.label.split(' ')[0]}
                </span>
                {i < 2 && <div className={`h-px w-4 sm:w-8 mx-1 ${done ? 'bg-emerald-500' : 'bg-muted'}`} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
