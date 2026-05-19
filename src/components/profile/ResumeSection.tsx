'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  FileText, Sparkles, AlertTriangle, CheckCircle2,
  Lightbulb, Loader2, RefreshCw, Upload, Brain,
  BookOpen, Briefcase, Code2, X, ArrowRight
} from 'lucide-react'
import type { ResumeInsights } from '@/types/database'
import type { ResumeSuggestion } from '@/lib/openai'
import { createClient } from '@/lib/supabase/client'

interface Props {
  insights: ResumeInsights | null
  userId: string
}

// ─── Upload + analyze inline component ───────────────────────────────────────

type UploadStep = 'idle' | 'uploading' | 'analyzing' | 'scraping' | 'done' | 'error'

const STEP_MESSAGES: Record<UploadStep, string> = {
  idle:      '',
  uploading: 'Uploading PDF securely…',
  analyzing: 'GPT-4o is reading your resume…',
  scraping:  'Kicking off fresh job scan…',
  done:      'Done! Redirecting to your matches…',
  error:     '',
}

function ResumeUploader({ userId }: { userId: string }) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState<UploadStep>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const validate = (f: File): string | null => {
    if (f.type !== 'application/pdf') return 'PDF files only'
    if (f.size > 5 * 1024 * 1024) return 'Max file size is 5 MB'
    return null
  }

  const handleSelect = useCallback((f: File) => {
    const err = validate(f)
    if (err) { toast.error(err); return }
    setFile(f)
    setError('')
  }, [])

  async function handleUpload() {
    if (!file) return
    setError('')
    setStep('uploading')
    setProgress(10)

    try {
      const supabase = createClient()

      // 1. Upload to Supabase Storage
      const fileName = `${userId}/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { upsert: true })
      if (uploadErr) throw uploadErr

      setProgress(30)
      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(fileName)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('profiles').update({ resume_url: publicUrl } as any).eq('id', userId)

      // 2. Analyze with GPT-4o
      setStep('analyzing')
      setProgress(50)

      const form = new FormData()
      form.append('resume', file)
      form.append('userId', userId)
      form.append('resumeUrl', publicUrl)

      const analyzeRes = await fetch('/api/resume/analyze', { method: 'POST', body: form })
      if (!analyzeRes.ok) {
        const d = await analyzeRes.json()
        throw new Error(d.message || 'Analysis failed')
      }

      setProgress(80)

      // 3. Trigger job scrape (non-blocking)
      setStep('scraping')
      fetch('/api/jobs/scrape', { method: 'POST' }).catch(() => {})

      setProgress(100)
      setStep('done')
      toast.success('Resume updated! Fetching fresh job matches…')

      // Redirect to jobs tab
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('error')
      setProgress(0)
    }
  }

  const busy = step !== 'idle' && step !== 'error' && step !== 'done'

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200
          ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20'}
          ${file ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20' : ''}
          ${busy ? 'pointer-events-none opacity-60' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleSelect(f) }}
        onClick={() => !busy && !file && document.getElementById('resume-reupload')?.click()}
      >
        <input
          id="resume-reupload"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={e => e.target.files?.[0] && handleSelect(e.target.files[0])}
        />

        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · PDF</p>
            {!busy && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setFile(null) }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors mt-1"
              >
                <X className="h-3 w-3" />Remove
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Upload className="h-5 w-5" />
            </div>
            <p className="font-semibold text-sm text-foreground">
              {dragging ? 'Drop your resume here' : 'Drag & drop new resume'}
            </p>
            <p className="text-xs">or <span className="text-primary underline underline-offset-2">browse files</span> · PDF · max 5 MB</p>
          </div>
        )}
      </div>

      {/* Progress */}
      {busy && (
        <div className="rounded-xl bg-muted/50 border px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <p className="text-xs font-medium">{STEP_MESSAGES[step]}</p>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {/* Error */}
      {step === 'error' && error && (
        <div className="flex items-start gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{error}
        </div>
      )}

      {/* Done banner */}
      {step === 'done' && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />Resume updated · Heading to your matches…
        </div>
      )}

      <Button
        className="w-full h-10 gap-2 font-semibold"
        disabled={!file || busy}
        onClick={handleUpload}
      >
        {busy
          ? <><Loader2 className="h-4 w-4 animate-spin" />{STEP_MESSAGES[step]}</>
          : <><Brain className="h-4 w-4" />Analyze & refresh jobs</>
        }
      </Button>
    </div>
  )
}

// ─── Suggestion card ──────────────────────────────────────────────────────────

const SUGGESTION_CONFIG = {
  critical:    { icon: AlertTriangle, label: 'Must fix',    cls: 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30',       ic: 'text-red-500',    badge: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
  improvement: { icon: Lightbulb,    label: 'Improvement', cls: 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30', ic: 'text-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
  tip:         { icon: CheckCircle2, label: 'Tip',         cls: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30', ic: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
}

function SuggestionCard({ s }: { s: ResumeSuggestion }) {
  const cfg = SUGGESTION_CONFIG[s.type]
  const Icon = cfg.icon
  return (
    <div className={`rounded-xl border p-4 space-y-2 ${cfg.cls}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.ic}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold">{s.title}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{s.detail}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ResumeSection({ insights, userId }: Props) {
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([])
  const [loadingSugg, setLoadingSugg] = useState(false)
  const [suggestionsRan, setSuggestionsRan] = useState(false)

  const skills      = (insights?.skills as string[]) ?? []
  const targetRoles = (insights?.target_roles as string[]) ?? []
  const jobTitles   = (insights?.job_titles as string[]) ?? []
  const education   = (insights?.education as { degree: string; field: string; institution: string; year: number | null }[]) ?? []
  const expYears    = insights?.experience_years as number | null
  const summary     = insights?.summary as string | null

  const profileScore = (() => {
    let s = 0
    if (skills.length >= 5) s += 25; else if (skills.length > 0) s += 10
    if (targetRoles.length > 0) s += 20
    if (jobTitles.length > 0) s += 20
    if (expYears) s += 15
    if (education.length > 0) s += 10
    if (summary) s += 10
    return s
  })()

  async function loadSuggestions() {
    setLoadingSugg(true)
    try {
      const res = await fetch('/api/resume/suggestions', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message || 'Failed'); return }
      setSuggestions(data.suggestions)
      setSuggestionsRan(true)
    } catch { toast.error('Failed to get suggestions.') }
    finally { setLoadingSugg(false) }
  }

  return (
    <div className="space-y-5">
      {/* ── Re-upload card ── */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <RefreshCw className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{insights ? 'Update Resume' : 'Upload Resume'}</p>
            <p className="text-xs text-muted-foreground">
              {insights
                ? 'Upload a new PDF — AI re-analyzes and fetches fresh job matches'
                : 'Upload your PDF to unlock AI insights and job matching'}
            </p>
          </div>
        </div>
        <div className="p-5">
          <ResumeUploader userId={userId} />
        </div>
      </div>

      {/* Show analysis only if resume exists */}
      {insights && (
        <>
          {/* Completeness */}
          <div className="bg-card rounded-2xl border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Resume completeness</p>
              </div>
              <span className={`text-sm font-bold ${profileScore >= 80 ? 'text-emerald-600' : profileScore >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                {profileScore}%
              </span>
            </div>
            <Progress value={profileScore} className="h-2" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Skills',       done: skills.length > 0 },
                { label: 'Target roles', done: targetRoles.length > 0 },
                { label: 'Experience',   done: !!expYears },
                { label: 'Education',    done: education.length > 0 },
              ].map(({ label, done }) => (
                <div key={label} className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 ${done ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* AI Summary */}
          {summary && (
            <div className="bg-card rounded-2xl border p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">AI Summary</p>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Extracted text */}
          <div className="bg-card rounded-2xl border overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-sm">Extracted Resume Text</p>
            </div>
            <div className="p-5">
              {insights.raw_text ? (
                <div className="relative">
                  <div className="bg-muted/30 rounded-xl border p-4 max-h-52 overflow-y-auto font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {(insights.raw_text as string).slice(0, 1500)}
                    {(insights.raw_text as string).length > 1500 && <span className="text-primary"> …</span>}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent rounded-b-xl pointer-events-none" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No text available</p>
              )}
            </div>
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="bg-card rounded-2xl border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold text-sm">Detected Skills ({skills.length})</p>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
              </div>
            </div>
          )}

          {/* Roles + History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-2xl border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Target Roles</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {targetRoles.length > 0
                  ? targetRoles.map(r => (
                      <span key={r} className="inline-flex items-center gap-1 text-xs bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium">
                        <Sparkles className="h-2.5 w-2.5" />{r}
                      </span>
                    ))
                  : <p className="text-xs text-muted-foreground">None detected</p>
                }
              </div>
            </div>

            <div className="bg-card rounded-2xl border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold text-sm">Job History</p>
              </div>
              <div className="space-y-1">
                {jobTitles.length > 0
                  ? jobTitles.map(t => (
                      <div key={t} className="flex items-center gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />{t}
                      </div>
                    ))
                  : <p className="text-xs text-muted-foreground">None detected</p>
                }
              </div>
            </div>
          </div>

          {/* Education */}
          {education.length > 0 && (
            <div className="bg-card rounded-2xl border p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold text-sm">Education</p>
              </div>
              <Separator />
              {education.map((edu, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                    <p className="text-xs text-muted-foreground">{edu.institution}{edu.year ? ` · ${edu.year}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Suggestions */}
          <div className="bg-card rounded-2xl border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-semibold text-sm">AI Resume Suggestions</p>
                  <p className="text-xs text-muted-foreground">GPT-4o feedback to strengthen your resume</p>
                </div>
              </div>
              {!suggestionsRan ? (
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={loadSuggestions} disabled={loadingSugg}>
                  {loadingSugg
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyzing…</>
                    : <><Sparkles className="h-3.5 w-3.5" />Analyze</>}
                </Button>
              ) : (
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={loadSuggestions} disabled={loadingSugg}>
                  {loadingSugg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Re-run'}
                </Button>
              )}
            </div>
            <div className="p-5">
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  {(['critical', 'improvement', 'tip'] as const).map(type => {
                    const group = suggestions.filter(s => s.type === type)
                    if (!group.length) return null
                    return <div key={type} className="space-y-2">{group.map((s, i) => <SuggestionCard key={i} s={s} />)}</div>
                  })}
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    Re-analyze after updating your resume
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  {loadingSugg ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-primary animate-pulse" />
                      </div>
                      <p className="text-sm text-muted-foreground">GPT-4o is reading your resume…</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Click <strong>Analyze</strong> to get specific suggestions to improve your resume for your target roles.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
