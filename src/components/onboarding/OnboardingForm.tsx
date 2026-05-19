'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Upload, FileText, CheckCircle2, Brain, ArrowRight,
  Sparkles, AlertCircle, X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface OnboardingFormProps {
  userId: string
}

type Step = 'upload' | 'analyzing' | 'done'

interface Insights {
  skills: string[]
  target_roles: string[]
  summary: string
}

const PROGRESS_MESSAGES = [
  { at: 0, msg: 'Preparing upload...' },
  { at: 20, msg: 'Uploading resume securely...' },
  { at: 40, msg: 'Extracting text from PDF...' },
  { at: 55, msg: 'Analyzing with GPT-4o...' },
  { at: 75, msg: 'Identifying skills and experience...' },
  { at: 88, msg: 'Building your profile...' },
  { at: 95, msg: 'Almost done...' },
]

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')

  const currentMsg = PROGRESS_MESSAGES.slice().reverse().find(m => progress >= m.at)?.msg ?? 'Processing...'

  function validateFile(f: File): string | null {
    if (f.type !== 'application/pdf') return 'Please upload a PDF file'
    if (f.size > 5 * 1024 * 1024) return 'File must be under 5MB'
    return null
  }

  const handleFileSelect = useCallback((f: File) => {
    const err = validateFile(f)
    if (err) { toast.error(err); return }
    setFile(f)
    setError('')
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  async function handleUpload() {
    if (!file) return
    setStep('analyzing')
    setError('')

    const tick = (n: number) => setProgress(n)

    try {
      const supabase = createClient()

      tick(10)
      const fileName = `${userId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { upsert: true })
      if (uploadError) throw uploadError

      tick(30)
      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(fileName)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('profiles').update({ resume_url: publicUrl } as any).eq('id', userId)

      tick(50)

      const formData = new FormData()
      formData.append('resume', file)
      formData.append('userId', userId)
      formData.append('resumeUrl', publicUrl)

      const response = await fetch('/api/resume/analyze', { method: 'POST', body: formData })

      tick(85)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Analysis failed')
      }

      const data = await response.json()
      tick(95)

      // Kick off a background job scrape so fresh results load immediately on dashboard
      fetch('/api/jobs/scrape', { method: 'POST' }).catch(() => {/* non-blocking */})

      tick(100)

      setTimeout(() => {
        setInsights(data.insights)
        setStep('done')
      }, 400)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('upload')
      setProgress(0)
    }
  }

  /* ── Done state ── */
  if (step === 'done' && insights) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border bg-background p-6 space-y-5">
          {/* Success header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Resume analyzed!</h3>
              <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{insights.summary}</p>
            </div>
          </div>

          <hr />

          {/* Skills */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Skills detected ({insights.skills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insights.skills.slice(0, 16).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {insights.skills.length > 16 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{insights.skills.length - 16} more
                </Badge>
              )}
            </div>
          </div>

          {/* Target roles */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Target roles identified
            </p>
            <div className="flex flex-wrap gap-1.5">
              {insights.target_roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center gap-1 text-xs bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium"
                >
                  <Sparkles className="h-3 w-3" />
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Button
          className="w-full h-11 font-semibold gap-2"
          onClick={() => router.push('/dashboard')}
        >
          View my job matches
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  /* ── Analyzing state ── */
  if (step === 'analyzing') {
    return (
      <div className="rounded-2xl border bg-background p-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold">Analyzing your resume</h3>
            <p className="text-sm text-muted-foreground">{currentMsg}</p>
          </div>

          <div className="w-full space-y-2">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Processing</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Upload state ── */
  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`
          relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-200
          ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'}
          ${file ? 'border-green-400 bg-green-50/50' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && document.getElementById('resume-input')?.click()}
      >
        <input
          id="resume-input"
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />

        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm text-green-700">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(file.size / 1024).toFixed(0)} KB · PDF
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">
                {dragging ? 'Drop your resume here' : 'Drag & drop your resume'}
              </p>
              <p className="text-xs mt-1">or <span className="text-primary underline underline-offset-2">browse files</span> · PDF only · Max 5MB</p>
            </div>
          </div>
        )}
      </div>

      <Button
        className="w-full h-11 font-semibold gap-2"
        onClick={handleUpload}
        disabled={!file}
      >
        <Brain className="h-4 w-4" />
        Analyze with GPT-4o
      </Button>
    </div>
  )
}
