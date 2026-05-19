import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { full_name } = body

    if (typeof full_name !== 'string' || full_name.trim().length < 1) {
      return NextResponse.json({ message: 'Invalid name' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('profiles').update({ full_name: full_name.trim() } as any).eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ message: 'Update failed' }, { status: 500 })
  }
}
