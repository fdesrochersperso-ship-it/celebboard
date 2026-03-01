import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

type RouteContext = {
  params: Promise<{ orgId: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { orgId } = await params
    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: org, error } = await supabase
      .from('organizations')
      .select('name, logo_url')
      .eq('id', orgId)
      .single()

    if (error || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      name: org.name,
      logo_url: org.logo_url ?? null,
    })
  } catch (err) {
    console.error('Submit info error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
