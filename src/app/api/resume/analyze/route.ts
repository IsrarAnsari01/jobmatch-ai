import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { analyzeResume } from '@/lib/openai'
import type { Database } from '@/types/database'
import { extractText, getDocumentProxy } from 'unpdf'

type InsightInsert = Database['public']['Tables']['resume_insights']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

async function extractPDFText(buffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buffer)
  const pdf = await getDocumentProxy(uint8)
  const { text } = await extractText(pdf, { mergePages: true })
  return text.trim()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const resumeFile = formData.get('resume') as File
    const userId = formData.get('userId') as string
    const resumeUrl = formData.get('resumeUrl') as string

    if (!resumeFile || !userId) {
      return NextResponse.json({ message: 'Missing resume or userId' }, { status: 400 })
    }

    const arrayBuffer = await resumeFile.arrayBuffer()
    const resumeText = await extractPDFText(Buffer.from(arrayBuffer))

    if (!resumeText || resumeText.length < 100) {
      return NextResponse.json(
        { message: 'Could not extract text from PDF. Please ensure it is not a scanned image.' },
        { status: 400 }
      )
    }

    const analysis = await analyzeResume(resumeText)
    const supabase = createServiceClient()

    const insightPayload: InsightInsert = {
      user_id: userId,
      raw_text: resumeText,
      skills: analysis.skills,
      experience_years: analysis.experience_years,
      job_titles: analysis.job_titles,
      target_roles: analysis.target_roles,
      education: analysis.education as Database['public']['Tables']['resume_insights']['Insert']['education'],
      summary: analysis.summary,
      keywords: analysis.keywords,
    }

    const { error: insightError } = await supabase
      .from('resume_insights')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(insightPayload as any, { onConflict: 'user_id' })

    if (insightError) throw insightError

    const profileUpdate: ProfileUpdate = { onboarding_completed: true, resume_url: resumeUrl }

    await supabase
      .from('profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(profileUpdate as any)
      .eq('id', userId)

    return NextResponse.json({
      insights: {
        skills: analysis.skills,
        target_roles: analysis.target_roles,
        summary: analysis.summary,
      },
    })
  } catch (error) {
    console.error('Resume analyze error:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
