import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

type RouteContext = {
  params: Promise<{ token: string }>
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { token } = await params

    const supabase = createServiceClient()

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('display_token', token)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Invalid display token' }, { status: 404 })
    }

    const { data: config } = await supabase
      .from('dashboard_config')
      .select('feed_rotation_seconds')
      .eq('org_id', org.id)
      .single()

    return NextResponse.json({
      feed_rotation_seconds: config?.feed_rotation_seconds ?? 25,
    })
  } catch (err) {
    console.error('Display config error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
