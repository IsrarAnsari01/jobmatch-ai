import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { jobListingId } = await request.json()
    if (!jobListingId) return NextResponse.json({ message: 'Missing jobListingId' }, { status: 400 })

    // Upsert — idempotent if user clicks Apply twice
    const { error } = await supabase
      .from('sent_applications')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ user_id: user.id, job_listing_id: jobListingId, status: 'applied' } as any,
        { onConflict: 'user_id,job_listing_id' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[apply]', err)
    return NextResponse.json({ message: 'Failed to record application' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('sent_applications')
      .select('*, job_listings(*)')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })

    return NextResponse.json({ applications: data ?? [] })
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
