import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeSkillGaps } from '@/lib/openai'
import type { JobListing, JobMatch } from '@/types/database'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // Get resume skills
    const { data: insights } = await supabase
      .from('resume_insights')
      .select('skills, target_roles, summary')
      .eq('user_id', user.id)
      .single()

    if (!insights || !(insights.skills as string[])?.length) {
      return NextResponse.json({ message: 'No resume found. Complete onboarding first.' }, { status: 400 })
    }

    // Get all scored job matches
    const { data: matches } = await supabase
      .from('job_matches')
      .select('score, job_listings(title, description)')
      .eq('user_id', user.id)
      .gte('score', 70)
      .order('score', { ascending: false })
      .limit(15)

    if (!matches || matches.length < 3) {
      return NextResponse.json(
        { message: 'Not enough job matches yet. Refresh your dashboard to scan for jobs first.' },
        { status: 400 }
      )
    }

    const jobDescriptions = matches
      .filter(m => {
        const jl = (m as unknown as { job_listings: JobListing | null }).job_listings
        return jl?.title && jl?.description
      })
      .map(m => {
        const jl = (m as unknown as { job_listings: JobListing; score: number })
        return { title: jl.job_listings.title, description: jl.job_listings.description, score: (m as unknown as JobMatch).score }
      })

    const result = await analyzeSkillGaps(insights.skills as string[], jobDescriptions)

    return NextResponse.json({ gaps: result })
  } catch (error) {
    console.error('[gap-analysis] error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
