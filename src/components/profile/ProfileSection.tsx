'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User, Mail, Briefcase, Sparkles, Edit3, Check, X,
  Clock, BookOpen, Award
} from 'lucide-react'
import type { Profile, ResumeInsights } from '@/types/database'

interface Props {
  user: { id: string; email: string }
  profile: Profile | null
  insights: ResumeInsights | null
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-4 border-b last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  )
}

export function ProfileSection({ user, profile, insights }: Props) {
  const [name, setName] = useState(profile?.full_name ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  async function saveName() {
    if (!name.trim()) { toast.error('Name cannot be empty'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name }),
      })
      if (!res.ok) { toast.error('Failed to save'); return }
      toast.success('Name updated!')
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setName(profile?.full_name ?? '')
    setEditing(false)
  }

  const skills       = (insights?.skills as string[]) ?? []
  const targetRoles  = (insights?.target_roles as string[]) ?? []
  const jobTitles    = (insights?.job_titles as string[]) ?? []
  const education    = (insights?.education as { degree: string; field: string; institution: string; year: number | null }[]) ?? []
  const expYears     = insights?.experience_years as number | null

  const initials = (profile?.full_name || user.email)
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="space-y-5">
      {/* Avatar + name card */}
      <div className="bg-card rounded-2xl border overflow-hidden">
        {/* Cover gradient */}
        <div className="h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />

        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/15 border-4 border-background flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{initials}</span>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setEditing(true)}>
                <Edit3 className="h-3.5 w-3.5" />Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs">Full name</Label>
                <Input
                  id="fullName"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-9"
                  placeholder="Your full name"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') cancelEdit() }}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={saveName} disabled={saving}>
                  <Check className="h-3.5 w-3.5" />{saving ? 'Saving...' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={cancelEdit}>
                  <X className="h-3.5 w-3.5" />Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold">{profile?.full_name || 'Add your name'}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Info rows */}
      <div className="bg-card rounded-2xl border px-5">
        <InfoRow icon={Mail} label="Email address">
          <p className="text-sm">{user.email}</p>
        </InfoRow>

        <InfoRow icon={Clock} label="Years of experience">
          <p className="text-sm font-medium">
            {expYears ? `${expYears} years` : <span className="text-muted-foreground">Not detected — upload resume</span>}
          </p>
        </InfoRow>

        <InfoRow icon={Briefcase} label="Past job titles">
          {jobTitles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {jobTitles.map(t => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Not detected</p>}
        </InfoRow>

        <InfoRow icon={Sparkles} label="Target roles">
          {targetRoles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {targetRoles.map(r => (
                <span key={r} className="inline-flex items-center gap-1 text-xs bg-primary/8 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-medium">
                  <Sparkles className="h-2.5 w-2.5" />{r}
                </span>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Not detected</p>}
        </InfoRow>

        {education.length > 0 && (
          <InfoRow icon={BookOpen} label="Education">
            <div className="space-y-2 mt-1">
              {education.map((edu, i) => (
                <div key={i} className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-sm font-medium">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                  <p className="text-xs text-muted-foreground">{edu.institution}{edu.year ? ` · ${edu.year}` : ''}</p>
                </div>
              ))}
            </div>
          </InfoRow>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-card rounded-2xl border p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-muted-foreground" />
            <p className="font-semibold text-sm">Skills ({skills.length})</p>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-1.5">
            {skills.map(s => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* No resume state */}
      {!insights && (
        <div className="bg-card rounded-2xl border border-dashed p-8 text-center space-y-2">
          <Briefcase className="h-8 w-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium">No resume uploaded yet</p>
          <p className="text-xs text-muted-foreground">Go to onboarding to upload your resume and unlock AI insights</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => window.location.href = '/onboarding'}>
            Upload Resume
          </Button>
        </div>
      )}
    </div>
  )
}
