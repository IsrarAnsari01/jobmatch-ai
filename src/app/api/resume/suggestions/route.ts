import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResumeSuggestions } from '@/lib/openai'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { data: insights } = await supabase
      .from('resume_insights')
      .select('raw_text, skills, job_titles, target_roles, experience_years')
      .eq('user_id', user.id)
      .single()

    if (!insights?.raw_text) {
      return NextResponse.json({ message: 'No resume found. Upload your resume first.' }, { status: 400 })
    }

    const suggestions = await getResumeSuggestions(
      insights.raw_text as string,
      (insights.skills as string[]) ?? [],
      (insights.job_titles as string[]) ?? [],
      (insights.target_roles as string[]) ?? [],
      insights.experience_years as number | null,
    )

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[resume-suggestions]', error)
    return NextResponse.json({ message: 'Failed to generate suggestions' }, { status: 500 })
  }
}
