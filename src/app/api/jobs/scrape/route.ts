import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchJobsFromJSearch, type ScrapedJob } from '@/lib/scraper'
import { scoreJobMatch } from '@/lib/openai'
import type { ResumeInsights, JobMatchWithListing } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const MIN_SCORE = 70
const CONCURRENCY = 6   // parallel GPT-4o calls per batch
const FIRST_BATCH = 50  // jobs to score before returning response
const BG_BATCH = 60     // additional jobs scored in background

// ─── Score a single job + persist if it passes threshold ─────────────────────

async function scoreAndSave(
  job: ScrapedJob,
  userId: string,
  insights: ResumeInsights,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svc: SupabaseClient<Database>
): Promise<JobMatchWithListing | null> {
  try {
    const { data: listing, error: le } = await svc
      .from('job_listings')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({
        title: job.title, company: job.company, location: job.location,
        description: job.description, url: job.url, hr_email: job.hr_email,
        platform: job.platform, scraped_at: new Date().toISOString(),
      } as any, { onConflict: 'url' })
      .select()
      .single()

    if (le || !listing) { console.warn('[scrape] listing upsert:', le?.message); return null }

    const scoreResult = await scoreJobMatch(job.title, job.description, {
      skills: insights.skills ?? [],
      experience_years: insights.experience_years,
      job_titles: insights.job_titles ?? [],
      target_roles: insights.target_roles ?? [],
      keywords: insights.keywords ?? [],
      summary: insights.summary,
    })

    console.log(`[scrape] "${job.title}" @ ${job.company} → ${scoreResult.score}`)

    if (scoreResult.score < MIN_SCORE) return null

    const { data: match, error: me } = await svc
      .from('job_matches')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({
        user_id: userId,
        job_listing_id: (listing as { id: string }).id,
        score: scoreResult.score,
        match_reasons: scoreResult.match_reasons,
      } as any, { onConflict: 'user_id,job_listing_id' })
      .select('*, job_listings(*)')
      .single()

    if (me) { console.warn('[scrape] match upsert:', me.message); return null }
    return match as unknown as JobMatchWithListing
  } catch (err) {
    console.warn('[scrape] job error:', (err as Error).message)
    return null
  }
}

// ─── Process a list of jobs with controlled concurrency ───────────────────────

async function processBatch(
  jobs: ScrapedJob[],
  userId: string,
  insights: ResumeInsights,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  svc: SupabaseClient<Database>,
  concurrency: number
): Promise<JobMatchWithListing[]> {
  const results: JobMatchWithListing[] = []

  // Run `concurrency` jobs at a time
  for (let i = 0; i < jobs.length; i += concurrency) {
    const slice = jobs.slice(i, i + concurrency)
    const settled = await Promise.allSettled(
      slice.map(job => scoreAndSave(job, userId, insights, svc))
    )
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value)
    }
  }

  return results
}

// ─── Route handler ────────────────────────────────────────────────────────────

const DEFAULT_SINCE_MS = 3 * 24 * 3600 * 1000   // 3 days
const MAX_SINCE_MS     = 30 * 24 * 3600 * 1000  // 1 month cap

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const sinceMs = Math.min(
      typeof body?.sinceMs === 'number' && body.sinceMs > 0 ? body.sinceMs : DEFAULT_SINCE_MS,
      MAX_SINCE_MS
    )

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { data: rawInsights } = await supabase
      .from('resume_insights')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!rawInsights) {
      return NextResponse.json(
        { message: 'No resume found. Please complete onboarding first.' },
        { status: 400 }
      )
    }

    const insights = rawInsights as unknown as ResumeInsights

    const skillTags = (insights.skills ?? [])
      .map(s => s.toLowerCase().trim())
      .filter(s => s.length >= 2 && s.length <= 25)
      .slice(0, 5)

    const searchTerms = [
      ...(insights.target_roles ?? []).slice(0, 2),
      ...skillTags.slice(0, 3),
    ]

    if (searchTerms.length === 0) {
      return NextResponse.json(
        { message: 'Resume profile incomplete. Re-upload your resume.' },
        { status: 400 }
      )
    }

    console.log(`[scrape] search terms: ${JSON.stringify(searchTerms)}, sinceMs: ${sinceMs}`)
    const scrapedJobs = await fetchJobsFromJSearch(searchTerms, 'remote', sinceMs)
    console.log(`[scrape] scraped: ${scrapedJobs.length} jobs`)

    if (scrapedJobs.length === 0) {
      return NextResponse.json({ matches: [], debug: { scraped: 0, scored: 0, passed: 0 } })
    }

    const svc = createServiceClient()
    const firstBatch = scrapedJobs.slice(0, FIRST_BATCH)
    const bgBatch    = scrapedJobs.slice(FIRST_BATCH, FIRST_BATCH + BG_BATCH)

    // ── Score first batch in parallel (returned to client) ──
    console.log(`[scrape] scoring first ${firstBatch.length} jobs (${CONCURRENCY} parallel)…`)
    const matches = await processBatch(firstBatch, user.id, insights, svc, CONCURRENCY)
    matches.sort((a, b) => b.score - a.score)

    console.log(`[scrape] first batch done — ${matches.length} matched`)

    // ── Fire-and-forget background batch ──
    if (bgBatch.length > 0) {
      console.log(`[scrape] starting background batch of ${bgBatch.length} jobs…`)
      processBatch(bgBatch, user.id, insights, svc, CONCURRENCY)
        .then(bg => console.log(`[scrape] background batch done — ${bg.length} more matches saved`))
        .catch(err => console.error('[scrape] background batch error:', err))
    }

    return NextResponse.json({
      matches,
      debug: {
        scraped: scrapedJobs.length,
        scored: firstBatch.length,
        passed: matches.length,
        background: bgBatch.length,
        sinceMs,
      },
    })
  } catch (error) {
    console.error('[scrape] fatal:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { data: matches } = await supabase
      .from('job_matches')
      .select('*, job_listings(*)')
      .eq('user_id', user.id)
      .gte('score', MIN_SCORE)
      .order('score', { ascending: false })

    return NextResponse.json({ matches: matches ?? [] })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
