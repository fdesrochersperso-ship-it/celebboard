import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const UpdateKpiSchema = z.object({
  label: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  format: z.enum(['number', 'currency', 'percentage']).optional(),
  currency: z.string().optional(),
  source_type: z.enum(['integration', 'celebration_aggregate', 'manual']).optional(),
  integration_id: z.string().uuid().nullable().optional(),
  query_config: z.record(z.string(), z.unknown()).optional(),
  show_trend: z.boolean().optional(),
  trend_period: z.string().optional(),
  refresh_seconds: z.number().optional(),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
  cached_value: z.unknown().optional(),
  cached_at: z.string().optional(),
})

type RouteContext = {
  params: Promise<{ id: string }>
}

async function getOrgId(request: NextRequest) {
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
  if (!user) return null

  const supabase = createServiceClient()
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  return membership?.org_id ?? null
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const orgId = await getOrgId(request)
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: existing, error: fetchError } = await supabase
      .from('kpi_definitions')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 })
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = UpdateKpiSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: String(parsed.error) },
        { status: 400 }
      )
    }

    const payload = parsed.data as Record<string, unknown>
    delete payload.id

    const { error: updateError } = await supabase
      .from('kpi_definitions')
      .update(payload)
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
    console.error('KPI update error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params
    const orgId = await getOrgId(request)
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('kpi_definitions')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('KPI delete error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
