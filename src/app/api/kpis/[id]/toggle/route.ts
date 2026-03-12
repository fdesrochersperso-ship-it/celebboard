import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const ToggleSchema = z.object({
  is_active: z.boolean(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params

    const supabaseAuth = createServerClient(
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

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!membership?.org_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 403 }
      )
    }

    const orgId = membership.org_id

    const { data: kpi, error: fetchError } = await supabase
      .from('kpi_definitions')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = ToggleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body: is_active must be boolean' },
        { status: 400 }
      )
    }

    const { is_active } = parsed.data

    const { error: updateError } = await supabase
      .from('kpi_definitions')
      .update({ is_active })
      .eq('id', id)
      .eq('org_id', orgId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('KPI toggle error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
