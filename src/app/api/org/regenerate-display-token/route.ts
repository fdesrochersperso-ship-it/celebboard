import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId } = body

    if (!orgId || typeof orgId !== 'string') {
      return NextResponse.json(
        { error: 'Missing orgId' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this org' }, { status: 403 })
    }

    const serviceSupabase = createServiceClient()
    const newToken = randomBytes(32).toString('hex')

    const { error } = await serviceSupabase
      .from('organizations')
      .update({ display_token: newToken, updated_at: new Date().toISOString() })
      .eq('id', orgId)

    if (error) {
      console.error('Regenerate token error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ display_token: newToken })
  } catch (err) {
    console.error('Regenerate token error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
