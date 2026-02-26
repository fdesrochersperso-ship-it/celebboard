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

    const { data: kpis, error } = await supabase
      .from('kpi_definitions')
      .select('id, label, format, currency, cached_value, refresh_seconds')
      .eq('org_id', org.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
    }

    const formatted = (kpis ?? []).map((k) => {
      const cached = k.cached_value as { value?: number } | null
      const value = cached?.value ?? null
      return {
        id: k.id,
        label: k.label,
        format: k.format ?? 'number',
        currency: k.currency ?? 'CAD',
        value,
        refresh_seconds: k.refresh_seconds ?? 300,
      }
    })

    return NextResponse.json({ kpis: formatted })
  } catch (err) {
    console.error('Display KPIs error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
