import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
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
      .select('id, source_type, integration_id, query_config')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !kpi) {
      return NextResponse.json({ error: 'KPI not found' }, { status: 404 })
    }

    let cachedValue: unknown = null

    if (kpi.source_type === 'manual') {
      const { data: row } = await supabase
        .from('kpi_definitions')
        .select('cached_value')
        .eq('id', id)
        .single()
      cachedValue = (row as { cached_value?: unknown })?.cached_value ?? null
    } else if (kpi.source_type === 'celebration_aggregate') {
      const qc = (kpi.query_config ?? {}) as {
        template_ids?: string[]
        aggregate?: string
        field?: string
        date_range?: { type?: string }
      }
      const templateIds = qc.template_ids ?? []
      const period = qc.date_range?.type ?? 'this_quarter'
      const field = qc.field ?? 'amount'

      const now = new Date()
      let from = new Date(now)
      switch (period) {
        case 'this_month':
          from.setDate(1)
          from.setHours(0, 0, 0, 0)
          break
        case 'this_year':
          from.setMonth(0, 1)
          from.setHours(0, 0, 0, 0)
          break
        case 'last_30_days':
          from.setDate(from.getDate() - 30)
          break
        case 'last_90_days':
          from.setDate(from.getDate() - 90)
          break
        case 'last_12_months':
          from.setMonth(from.getMonth() - 12)
          break
        case 'this_quarter':
        default:
          const q = Math.floor(now.getMonth() / 3) + 1
          from.setMonth((q - 1) * 3, 1)
          from.setHours(0, 0, 0, 0)
          break
      }

      const { data: celebrations } = await supabase
        .from('celebrations')
        .select('id, amount, template_id')
        .eq('org_id', orgId)
        .gte('created_at', from.toISOString())
        .lte('created_at', now.toISOString())
        .in('status', ['pending', 'displayed'])

      let total = 0
      let count = 0
      for (const c of celebrations ?? []) {
        const tid = (c as { template_id?: string }).template_id
        if (templateIds.length > 0 && tid && !templateIds.includes(tid)) continue
        count++
        if (qc.aggregate === 'sum') {
          const amt = Number((c as { amount?: unknown }).amount ?? 0)
          total += amt
        }
      }

      cachedValue =
        qc.aggregate === 'sum'
          ? { value: total }
          : { value: count }
    }
    // Integration-sourced: would need to call HubSpot API - for now just touch cached_at
    // A background job typically handles this. We'll update cached_at to signal "refresh requested"
    else if (kpi.source_type === 'integration') {
      cachedValue = null
    }

    const { error: updateError } = await supabase
      .from('kpi_definitions')
      .update({
        cached_value: cachedValue,
        cached_at: new Date().toISOString(),
      })
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
    console.error('KPI refresh error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
