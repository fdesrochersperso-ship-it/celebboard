import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const FilterSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.unknown(),
  property_type: z.string(),
})

const DateRangeSchema = z.object({
  type: z.string(),
  date_field: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

const QueryConfigIntegrationSchema = z.object({
  object_type: z.string(),
  aggregation: z.string(),
  aggregate_field: z.string().optional(),
  filters: z.array(FilterSchema).default([]),
  date_range: DateRangeSchema,
})

const QueryConfigCelebrationSchema = z.object({
  template_ids: z.array(z.string()),
  aggregate: z.enum(['sum', 'count']),
  field: z.string().optional(),
  date_range: z.object({
    type: z.string(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
})

const CreateKpiSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  name: z.string().min(1, 'Name is required'),
  format: z.enum(['number', 'currency', 'percentage']),
  currency: z.string().default('CAD'),
  source_type: z.enum(['integration', 'celebration_aggregate', 'manual']),
  integration_id: z.string().uuid().nullable(),
  query_config: z.record(z.string(), z.unknown()).default({}),
  show_trend: z.boolean().default(true),
  trend_period: z.string().default('previous_period'),
  refresh_seconds: z.number().default(300),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  cached_value: z.unknown().optional(),
  cached_at: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
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
        { error: 'No organization found. Complete setup first.' },
        { status: 403 }
      )
    }

    const orgId = membership.org_id

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = CreateKpiSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join('; ')
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const data = parsed.data

    if (data.source_type === 'integration' && !data.integration_id) {
      return NextResponse.json(
        { error: 'Integration is required for integration-sourced KPIs' },
        { status: 400 }
      )
    }

    const payload = {
      org_id: orgId,
      name: data.name,
      label: data.label,
      source_type: data.source_type,
      integration_id: data.integration_id,
      query_config: data.query_config,
      format: data.format,
      currency: data.currency,
      show_trend: data.show_trend,
      trend_period: data.trend_period,
      refresh_seconds: data.refresh_seconds,
      sort_order: data.sort_order,
      is_active: data.is_active,
      ...(data.cached_value != null && { cached_value: data.cached_value }),
      ...(data.cached_at && { cached_at: data.cached_at }),
    }

    const { data: inserted, error } = await supabase
      .from('kpi_definitions')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: { id: inserted.id } })
  } catch (err) {
    console.error('KPI create error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
