import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileShell } from '@/components/profile/ProfileShell'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: insights }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('resume_insights').select('*').eq('user_id', user.id).single(),
  ])

  return (
    <ProfileShell
      user={{ id: user.id, email: user.email ?? '' }}
      profile={profile ?? null}
      insights={insights ?? null}
    />
  )
}
