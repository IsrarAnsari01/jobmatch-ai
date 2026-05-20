import * as cheerio from 'cheerio'
import axios, { AxiosError } from 'axios'

export interface ScrapedJob {
  title: string
  company: string
  location: string
  description: string
  url: string
  hr_email: string | null
  platform: string
  postedAt: Date | null   // normalised publish date
}

// ─── Date-filter helpers ──────────────────────────────────────────────────────

function sinceDate(sinceMs: number): Date {
  return new Date(Date.now() - sinceMs)
}

function isRecent(date: Date | null, since: Date): boolean {
  if (!date) return true          // unknown date — keep it
  return date >= since
}

function parseDate(raw: string | number | null | undefined): Date | null {
  if (!raw) return null
  if (typeof raw === 'number') return new Date(raw < 1e10 ? raw * 1000 : raw)
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

/** Map sinceMs → JSearch `date_posted` param */
function toJSearchDatePosted(sinceMs: number): string {
  const h = sinceMs / 3600000
  if (h <= 24) return 'today'
  if (h <= 72) return '3days'
  if (h <= 168) return 'week'
  return 'month'
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export async function fetchJobsFromJSearch(
  keywords: string[],
  location = 'remote',
  sinceMs = 3 * 24 * 3600 * 1000   // default 3 days
): Promise<ScrapedJob[]> {
  const since = sinceDate(sinceMs)

  const results = await Promise.allSettled([
    fetchRemoteOKJobs(since),
    fetchJobicyJobs(keywords, since),
    fetchWWRJobs(since),
    fetchWorkingNomadsJobs(since),
    fetchHimalayasJobs(keywords, since),
    fetchArbeitnowJobs(keywords, since),   // +200 jobs
    fetchRemotiveJobs(keywords, since),    // +20 specialty jobs
  ])

  const jobs: ScrapedJob[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') jobs.push(...r.value)
    else console.warn('[scraper] source failed:', (r.reason as Error)?.message)
  }

  const apiKey = process.env.RAPIDAPI_KEY
  if (apiKey) {
    try { jobs.push(...(await callJSearch(apiKey, keywords, location, sinceMs))) }
    catch (e) { console.warn('[JSearch]', (e as AxiosError)?.response?.status === 429 ? '429 rate limit' : (e as Error).message) }
  }

  if (jobs.length === 0) {
    console.warn('[scraper] all sources empty — trying Indeed RSS')
    jobs.push(...(await scrapeIndeedJobs(keywords, location)))
  }

  console.log(`[scraper] total before dedup (sinceMs=${sinceMs}): ${jobs.length}`)
  return deduplicateJobs(jobs)
}

// ─── 1. RemoteOK ──────────────────────────────────────────────────────────────

async function fetchRemoteOKJobs(since: Date): Promise<ScrapedJob[]> {
  const r = await axios.get<{ position?: string; company?: string; location?: string; description?: string; apply_url?: string; url?: string; epoch?: number }[]>(
    'https://remoteok.com/api',
    { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobMatchBot/1.0)' }, timeout: 12000 }
  )
  return (r.data ?? [])
    .filter(j => j.position && j.company && (j.apply_url || j.url))
    .map(j => ({
      title: j.position!.trim(),
      company: j.company!.trim(),
      location: j.location || 'Remote',
      description: stripHtml(j.description ?? '').slice(0, 3000),
      url: j.apply_url || j.url!,
      hr_email: extractEmail(j.description ?? ''),
      platform: 'remoteok',
      postedAt: j.epoch ? new Date(j.epoch * 1000) : null,
    }))
    .filter(j => isRecent(j.postedAt, since))
    .slice(0, 50)
}

// ─── 2. Jobicy ────────────────────────────────────────────────────────────────

async function fetchJobicyJobs(keywords: string[], since: Date): Promise<ScrapedJob[]> {
  const tag = keywords.flatMap(k => k.toLowerCase().split(/\s+/)).slice(0, 2).join('+')
  const url = tag
    ? `https://jobicy.com/api/v2/remote-jobs?count=30&tag=${encodeURIComponent(tag)}`
    : 'https://jobicy.com/api/v2/remote-jobs?count=30'
  const r = await axios.get<{ jobs?: { jobTitle: string; companyName: string; jobGeo: string; jobDescription: string; url: string; pubDate?: string }[] }>(
    url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 }
  )
  return (r.data.jobs ?? [])
    .map(j => ({
      title: j.jobTitle.trim(),
      company: j.companyName.trim(),
      location: j.jobGeo || 'Remote',
      description: stripHtml(j.jobDescription ?? '').slice(0, 3000),
      url: j.url,
      hr_email: extractEmail(j.jobDescription ?? ''),
      platform: 'jobicy',
      postedAt: parseDate(j.pubDate),
    }))
    .filter(j => isRecent(j.postedAt, since))
}

// ─── 3. We Work Remotely ─────────────────────────────────────────────────────

async function fetchWWRJobs(since: Date): Promise<ScrapedJob[]> {
  const categories = ['remote-programming-jobs', 'remote-devops-sysadmin-jobs', 'remote-design-jobs']
  const allJobs: ScrapedJob[] = []

  for (const cat of categories) {
    try {
      const r = await axios.get<string>(
        `https://weworkremotely.com/categories/${cat}.rss`,
        { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml' }, timeout: 10000 }
      )
      const $ = cheerio.load(r.data, { xmlMode: true })
      $('item').each((_, el) => {
        const rawTitle = $(el).find('title').text().trim()
        const colonIdx = rawTitle.indexOf(':')
        const company  = colonIdx > -1 ? rawTitle.slice(0, colonIdx).trim() : 'Unknown'
        const title    = colonIdx > -1 ? rawTitle.slice(colonIdx + 1).trim() : rawTitle
        const link     = $(el).find('link').text().trim() || $(el).find('guid').text().trim()
        const region   = $(el).find('region').text().trim() || 'Remote'
        const desc     = stripHtml($(el).find('description').text()).trim()
        const pubDate  = $(el).find('pubDate').text().trim()
        const postedAt = parseDate(pubDate)

        if (title && link && isRecent(postedAt, since)) {
          allJobs.push({ title, company, location: region,
            description: desc.slice(0, 3000), url: link,
            hr_email: extractEmail(desc), platform: 'weworkremotely', postedAt })
        }
      })
    } catch (e) { console.warn('[WWR]', cat, (e as Error).message) }
  }
  return allJobs
}

// ─── 4. Working Nomads ───────────────────────────────────────────────────────

async function fetchWorkingNomadsJobs(since: Date): Promise<ScrapedJob[]> {
  const categories = ['back-end-programming', 'front-end-programming', 'full-stack-programming', 'devops-sysadmin']
  const allJobs: ScrapedJob[] = []

  await Promise.allSettled(categories.map(async cat => {
    const r = await axios.get<{ url: string; title: string; description: string; company_name: string; location: string; pub_date?: string }[]>(
      `https://www.workingnomads.com/api/exposed_jobs/?limit=30&category=${cat}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
    )
    for (const j of r.data ?? []) {
      const postedAt = parseDate(j.pub_date)
      if (!isRecent(postedAt, since)) continue
      allJobs.push({
        title: j.title.trim(), company: j.company_name.trim(),
        location: j.location || 'Remote',
        description: stripHtml(j.description ?? '').slice(0, 3000),
        url: j.url, hr_email: extractEmail(j.description ?? ''),
        platform: 'workingnomads', postedAt,
      })
    }
  }))
  return allJobs
}

// ─── 5. Himalayas ─────────────────────────────────────────────────────────────

async function fetchHimalayasJobs(keywords: string[], since: Date): Promise<ScrapedJob[]> {
  const query = keywords.slice(0, 2).join(' ')
  const r = await axios.get<{ jobs?: { title: string; companyName: string; locationRestrictions?: string[]; description: string; applicationLink: string; pubDate?: number }[] }>(
    `https://himalayas.app/jobs/api?limit=25&q=${encodeURIComponent(query)}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 }
  )
  return (r.data.jobs ?? [])
    .filter(j => j.title && j.companyName && j.applicationLink)
    .map(j => ({
      title: j.title.trim(), company: j.companyName.trim(),
      location: j.locationRestrictions?.join(', ') || 'Remote',
      description: stripHtml(j.description ?? '').slice(0, 3000),
      url: j.applicationLink, hr_email: extractEmail(j.description ?? ''),
      platform: 'himalayas',
      postedAt: parseDate(j.pubDate),
    }))
    .filter(j => isRecent(j.postedAt, since))
}

// ─── 6. Arbeitnow (free, no key, 100+ remote jobs) ────────────────────────────

interface ArbeitnowJob {
  title: string
  company_name: string
  location: string
  description: string
  url: string
  tags: string[]
  remote: boolean
  created_at: number    // unix timestamp (seconds)
}

async function fetchArbeitnowJobs(keywords: string[], since: Date): Promise<ScrapedJob[]> {
  const kw = keywords.map(k => k.toLowerCase())
  const allJobs: ScrapedJob[] = []
  const baseUrl = 'https://www.arbeitnow.com/api/job-board-api'
  const headers = { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }

  // Fetch 2 pages (200 jobs max) in parallel
  const rawPages = await Promise.allSettled([
    axios.get<{ data: ArbeitnowJob[] }>(`${baseUrl}?page=1`, { headers, timeout: 12000 }),
    axios.get<{ data: ArbeitnowJob[] }>(`${baseUrl}?page=2`, { headers, timeout: 12000 }),
  ])

  // axios.get<T> → response.data is T, so response.data.data is the jobs array
  const jobLists: ArbeitnowJob[][] = rawPages
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<{ data: { data: ArbeitnowJob[] } }>).value.data.data ?? [])

  for (const jobs of jobLists) {
    for (const job of jobs) {
      const postedAt = parseDate(job.created_at)
      if (!isRecent(postedAt, since)) continue

      // Keyword relevance check (title or tags match)
      const tagStr = (job.tags ?? []).join(' ').toLowerCase()
      const titleLower = job.title.toLowerCase()
      const relevant = kw.some(k => titleLower.includes(k) || tagStr.includes(k))
      if (!relevant) continue

      allJobs.push({
        title: job.title.trim(),
        company: job.company_name.trim(),
        location: job.location || 'Remote',
        description: stripHtml(job.description ?? '').slice(0, 3000),
        url: job.url,
        hr_email: extractEmail(job.description ?? ''),
        platform: 'arbeitnow',
        postedAt,
      })
    }
  }
  return allJobs
}

// ─── 7. Remotive (free, no key, curated remote jobs) ─────────────────────────

const REMOTIVE_CATEGORIES = [
  'software-dev', 'devops-sysadmin', 'design', 'product', 'data', 'backend', 'frontend',
]

interface RemotiveJob {
  title: string
  company_name: string
  candidate_required_location: string
  description: string
  url: string
  publication_date: string
}

async function fetchRemotiveJobs(keywords: string[], since: Date): Promise<ScrapedJob[]> {
  const kw = keywords.map(k => k.toLowerCase())
  const allJobs: ScrapedJob[] = []

  // Fetch multiple categories in parallel — Remotive filters well by category
  const results = await Promise.allSettled(
    REMOTIVE_CATEGORIES.slice(0, 3).map(cat =>
      axios.get<{ jobs: RemotiveJob[]; 'job-count': number }>(
        `https://remotive.com/api/remote-jobs?category=${cat}&limit=50`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }
      )
    )
  )

  for (const r of results) {
    if (r.status !== 'fulfilled') continue
    for (const job of r.value.data.jobs ?? []) {
      const postedAt = parseDate(job.publication_date)
      if (!isRecent(postedAt, since)) continue

      // Keyword relevance check
      const titleLower = job.title.toLowerCase()
      const descLower = (job.description ?? '').toLowerCase().slice(0, 500)
      const relevant = kw.some(k => titleLower.includes(k) || descLower.includes(k))
      if (!relevant) continue

      allJobs.push({
        title: job.title.trim(),
        company: job.company_name.trim(),
        location: job.candidate_required_location || 'Remote',
        description: stripHtml(job.description ?? '').slice(0, 3000),
        url: job.url,
        hr_email: extractEmail(job.description ?? ''),
        platform: 'remotive',
        postedAt,
      })
    }
  }
  return allJobs
}

// ─── 8. JSearch (optional) ───────────────────────────────────────────────────

async function callJSearch(apiKey: string, keywords: string[], location: string, sinceMs: number): Promise<ScrapedJob[]> {
  const query = `${keywords.slice(0, 2).join(' OR ')} ${location}`.trim()
  const r = await axios.get<{ data?: { job_title: string; employer_name: string; job_city?: string | null; job_state?: string | null; job_country?: string | null; job_description: string; job_apply_link: string; job_publisher: string; job_posted_at_datetime_utc?: string }[]; status: string }>(
    'https://jsearch.p.rapidapi.com/search',
    {
      params: { query, page: '1', num_pages: '1', date_posted: toJSearchDatePosted(sinceMs) },
      headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'jsearch.p.rapidapi.com' },
      timeout: 15000,
    }
  )
  if (r.data.status !== 'OK' || !r.data.data?.length) return []
  return r.data.data.filter(j => j.job_title && j.employer_name && j.job_apply_link).map(j => ({
    title: j.job_title.trim(), company: j.employer_name.trim(),
    location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || location,
    description: (j.job_description ?? '').slice(0, 3000),
    url: j.job_apply_link, hr_email: extractEmail(j.job_description ?? ''),
    platform: normalizePlatform(j.job_publisher ?? ''),
    postedAt: parseDate(j.job_posted_at_datetime_utc),
  }))
}

function normalizePlatform(p: string): string {
  const l = p.toLowerCase()
  if (l.includes('linkedin'))     return 'linkedin'
  if (l.includes('indeed'))       return 'indeed'
  if (l.includes('glassdoor'))    return 'glassdoor'
  if (l.includes('ziprecruiter')) return 'ziprecruiter'
  return l.replace(/\s+/g, '-') || 'other'
}

// ─── 7. Indeed RSS (fallback) ─────────────────────────────────────────────────

export async function scrapeIndeedJobs(keywords: string[], location = 'remote'): Promise<ScrapedJob[]> {
  const jobs: ScrapedJob[] = []
  for (const kw of keywords.slice(0, 2)) {
    try {
      const r = await axios.get<string>(
        `https://www.indeed.com/rss?q=${encodeURIComponent(kw)}&l=${encodeURIComponent(location)}&sort=date&limit=20`,
        { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml' }, timeout: 10000 }
      )
      const $ = cheerio.load(r.data, { xmlMode: true })
      $('item').each((_, el) => {
        const title = $(el).find('title').first().text().trim()
        const link  = $(el).find('link').first().text().trim() || $(el).find('guid').text().trim()
        const text  = cheerio.load($(el).find('description').first().text())('body').text().trim()
        const pubDate = $(el).find('pubDate').text().trim()
        if (title && link) {
          jobs.push({
            title: title.replace(/ at .+$/, '').trim(),
            company: text.match(/^(.+?)\s*[-–]\s/)?.[1] ?? 'Unknown',
            location: text.match(/Location:\s*(.+?)(?:\n|<)/i)?.[1]?.trim() ?? 'Not specified',
            description: text.slice(0, 3000), url: link,
            hr_email: extractEmail(text), platform: 'indeed',
            postedAt: parseDate(pubDate),
          })
        }
      })
    } catch { /* skip */ }
  }
  return deduplicateJobs(jobs)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

function extractEmail(text: string): string | null {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
  if (!m) return null
  return m.find(e => !['noreply','no-reply','example','sentry'].some(b => e.includes(b))) ?? null
}

function deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Set<string>()
  return jobs.filter(j => { if (seen.has(j.url)) return false; seen.add(j.url); return true })
}
