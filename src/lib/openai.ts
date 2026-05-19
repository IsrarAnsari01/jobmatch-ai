import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ResumeAnalysis {
  skills: string[]
  experience_years: number | null
  job_titles: string[]
  target_roles: string[]
  education: {
    degree: string
    field: string
    institution: string
    year: number | null
  }[]
  summary: string
  keywords: string[]
}

export async function analyzeResume(resumeText: string): Promise<ResumeAnalysis> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert resume parser. Extract structured information from resumes and return valid JSON.`,
      },
      {
        role: 'user',
        content: `Analyze this resume and return a JSON object with these exact fields:
- skills: array of technical and soft skills (strings)
- experience_years: total years of professional experience as a decimal number (e.g. 4.5) or null if unknown
- job_titles: array of past job titles held
- target_roles: array of job roles this person is likely targeting based on their background
- education: array of {degree, field, institution, year} objects
- summary: 2-3 sentence professional summary
- keywords: array of important keywords for job matching (skills, technologies, industries)

Resume text:
${resumeText}`,
      },
    ],
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI')

  return JSON.parse(content) as ResumeAnalysis
}

export interface JobScoreResult {
  score: number
  match_reasons: string[]
}

export interface SkillGap {
  skill: string
  frequency: number      // how many job descriptions mention it
  importance: 'high' | 'medium' | 'low'
  context: string        // short note on why it matters
}

export interface GapAnalysisResult {
  missing_skills: SkillGap[]
  top_suggestion: string   // one-sentence actionable tip
  resume_strength: string  // what's already strong
}

export interface ResumeSuggestion {
  type: 'critical' | 'improvement' | 'tip'
  title: string
  detail: string
}

export async function getResumeSuggestions(
  resumeText: string,
  skills: string[],
  jobTitles: string[],
  targetRoles: string[],
  experienceYears: number | null
): Promise<ResumeSuggestion[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert resume coach. Give specific, actionable feedback on how to improve this resume for the job market.`,
      },
      {
        role: 'user',
        content: `Review this resume and return JSON with:
{
  "suggestions": array of up to 6 objects with:
    - type: "critical" (must fix), "improvement" (should fix), or "tip" (nice to have)
    - title: short label (4-6 words)
    - detail: 1-2 sentences of specific actionable advice

Candidate profile:
- Skills: ${skills.slice(0, 20).join(', ')}
- Past job titles: ${jobTitles.slice(0, 5).join(', ')}
- Target roles: ${targetRoles.slice(0, 4).join(', ')}
- Experience: ${experienceYears ?? 'unknown'} years

Resume text (first 2000 chars):
${resumeText.slice(0, 2000)}`,
      },
    ],
  })
  const content = response.choices[0].message.content
  if (!content) throw new Error('No response')
  const parsed = JSON.parse(content)
  return (parsed.suggestions ?? []) as ResumeSuggestion[]
}

export async function analyzeSkillGaps(
  resumeSkills: string[],
  jobDescriptions: { title: string; description: string; score: number }[]
): Promise<GapAnalysisResult> {
  const topJobs = jobDescriptions
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(j => `[${j.score}% match] ${j.title}:\n${j.description.slice(0, 600)}`)
    .join('\n\n---\n\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a career coach analyzing skill gaps between a candidate's resume and job listings they closely match. Be specific and actionable.`,
      },
      {
        role: 'user',
        content: `Analyze what skills the candidate is missing based on these job descriptions they match.

Candidate's current skills: ${resumeSkills.slice(0, 30).join(', ')}

Top matching job descriptions:
${topJobs}

Return JSON with:
- missing_skills: array of up to 8 objects with { skill, frequency (1-10), importance ("high"|"medium"|"low"), context (one sentence why it matters) }
  Only include skills NOT already in the candidate's list above.
  frequency = how many of the jobs above mention or imply this skill.
- top_suggestion: single actionable sentence for the biggest gap
- resume_strength: one sentence about what's already strong in their profile`,
      },
    ],
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI')
  return JSON.parse(content) as GapAnalysisResult
}

export async function scoreJobMatch(
  jobTitle: string,
  jobDescription: string,
  resumeInsights: {
    skills: string[]
    experience_years: number | null
    job_titles: string[]
    target_roles: string[]
    keywords: string[]
    summary: string | null
  }
): Promise<JobScoreResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a professional recruiter scoring job-candidate fit. Be realistic and generous — a candidate does not need to match 100% of requirements to be a strong fit. Score based on overall alignment, not perfection.

Scoring guide:
90-100: Excellent fit — most skills match, right seniority level, closely aligned role
75-89: Good fit — solid overlap, minor gaps that can be learned
60-74: Partial fit — some relevant skills but notable mismatches
Below 60: Poor fit — significant skill or role mismatch`,
      },
      {
        role: 'user',
        content: `Score this job match and return JSON with exactly:
- score: integer 0-100
- match_reasons: array of 3 concise reasons (positive or negative)

Job Title: ${jobTitle}
Job Description: ${jobDescription.slice(0, 1500)}

Candidate:
- Skills: ${resumeInsights.skills.slice(0, 20).join(', ')}
- Experience: ${resumeInsights.experience_years ?? 'unknown'} years
- Past Roles: ${resumeInsights.job_titles.slice(0, 5).join(', ')}
- Target Roles: ${resumeInsights.target_roles.slice(0, 5).join(', ')}
- Summary: ${resumeInsights.summary ?? ''}`,
      },
    ],
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('No response from OpenAI')

  return JSON.parse(content) as JobScoreResult
}
