import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: insights }, { data: allMatches }, { data: profile }, { data: applied }] =
    await Promise.all([
      supabase.from('resume_insights').select('skills, target_roles, summary, experience_years, keywords').eq('user_id', user!.id).single(),
      supabase.from('job_matches').select('*, job_listings(*)').eq('user_id', user!.id).gte('score', 70).order('score', { ascending: false }),
      supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
      supabase.from('sent_applications').select('job_listing_id').eq('user_id', user!.id),
    ])

  const firstName = (profile as { full_name: string | null } | null)?.full_name?.split(' ')[0] ?? null
  const appliedIds = (applied ?? []).map(a => (a as { job_listing_id: string }).job_listing_id)

  return (
    <DashboardShell
      firstName={firstName}
      insights={insights ?? null}
      initialMatches={allMatches ?? []}
      initialAppliedIds={appliedIds}
    />
  )
}
