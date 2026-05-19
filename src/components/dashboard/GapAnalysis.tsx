'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, TrendingUp, Lightbulb, CheckCircle2, AlertTriangle, Info, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GapAnalysisResult, SkillGap } from '@/lib/openai'

const IMPORTANCE_CONFIG = {
  high:   { label: 'High priority', color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 border-red-100 dark:bg-red-950 dark:border-red-900',    dot: 'bg-red-500' },
  medium: { label: 'Medium',        color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 border-amber-100 dark:bg-amber-950 dark:border-amber-900', dot: 'bg-amber-500' },
  low:    { label: 'Nice to have',  color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-50 border-blue-100 dark:bg-blue-950 dark:border-blue-900',   dot: 'bg-blue-500' },
}

function FrequencyBar({ value }: { value: number }) {
  const pct = Math.min(100, (value / 10) * 100)
  const color = value >= 7 ? 'bg-red-500' : value >= 4 ? 'bg-amber-500' : 'bg-blue-400'
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{value}/10 jobs</span>
    </div>
  )
}

function SkillGapCard({ gap }: { gap: SkillGap }) {
  const cfg = IMPORTANCE_CONFIG[gap.importance]
  return (
    <div className={`rounded-xl border p-3.5 space-y-1.5 ${cfg.bg}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
          <span className="font-semibold text-sm">{gap.skill}</span>
        </div>
        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>
      <FrequencyBar value={gap.frequency} />
      <p className="text-xs text-muted-foreground leading-relaxed">{gap.context}</p>
    </div>
  )
}

export function GapAnalysis() {
  const [result, setResult] = useState<GapAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [ran, setRan] = useState(false)

  async function runAnalysis() {
    setLoading(true)
    try {
      const res = await fetch('/api/resume/gap-analysis', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message || 'Analysis failed'); return }
      setResult(data.gaps)
      setRan(true)
      setExpanded(true)
    } catch {
      toast.error('Gap analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const high   = result?.missing_skills.filter(g => g.importance === 'high') ?? []
  const medium = result?.missing_skills.filter(g => g.importance === 'medium') ?? []
  const low    = result?.missing_skills.filter(g => g.importance === 'low') ?? []

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => ran && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Resume Gap Analysis</p>
            <p className="text-xs text-muted-foreground">
              {ran ? 'Skills to add for better matches' : 'Find what\'s missing from your resume'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!ran && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={(e) => { e.stopPropagation(); runAnalysis() }}
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyzing...</>
                : <><Sparkles className="h-3.5 w-3.5" />Analyze</>
              }
            </Button>
          )}
          {ran && (
            <>
              <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={(e) => { e.stopPropagation(); runAnalysis() }} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Re-run'}
              </Button>
              {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {result && expanded && (
        <div className="px-5 pb-5 space-y-5 border-t">
          {/* Strength banner */}
          <div className="flex items-start gap-2.5 pt-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">What you already have</p>
              <p className="text-xs text-muted-foreground mt-0.5">{result.resume_strength}</p>
            </div>
          </div>

          {/* Top suggestion */}
          <div className="flex items-start gap-2.5 bg-violet-50 dark:bg-violet-950/50 border border-violet-100 dark:border-violet-900 rounded-xl p-3.5">
            <Lightbulb className="h-4 w-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">Top recommendation</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{result.top_suggestion}</p>
            </div>
          </div>

          {/* Skill gaps by importance */}
          {high.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">High priority gaps ({high.length})</p>
              </div>
              {high.map(g => <SkillGapCard key={g.skill} gap={g} />)}
            </div>
          )}

          {medium.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Medium priority ({medium.length})</p>
              </div>
              {medium.map(g => <SkillGapCard key={g.skill} gap={g} />)}
            </div>
          )}

          {low.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Nice to have ({low.length})</p>
              {low.map(g => <SkillGapCard key={g.skill} gap={g} />)}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center pt-1">
            Analysis based on your {result.missing_skills.length > 0 ? 'top job matches' : 'profile'} · Re-run after refreshing your matches
          </p>
        </div>
      )}

      {/* Empty/loading state */}
      {!result && !loading && (
        <div className="px-5 pb-5 border-t">
          <div className="py-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Click <strong>Analyze</strong> to see which skills appear in your top job matches but are missing from your resume.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Requires at least 3 job matches on your dashboard
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
