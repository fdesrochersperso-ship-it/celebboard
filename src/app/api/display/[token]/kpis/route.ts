import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

type RouteContext = {
  params: Promise<{ token: string }>
}

type Leader = {
  id: string
  name: string
  photo_url: string | null
  value: number
}

type QueryConfig = {
  show_leaderboard?: boolean
  goal?: number
  template_ids?: string[]
  field?: string
  aggregate?: string
  period?: string
  leader_overrides?: { team_member_id: string; value: number }[]
}

function getPeriodBounds(period: string): { from: Date; to: Date } {
  const now = new Date()
  const to = new Date(now)
  let from = new Date(now)

  switch (period) {
    case 'day':
      from.setHours(0, 0, 0, 0)
      break
    case 'week':
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      from.setDate(diff)
      from.setHours(0, 0, 0, 0)
      break
    case 'month':
      from.setDate(1)
      from.setHours(0, 0, 0, 0)
      break
    case 'quarter':
    default:
      const q = Math.floor(now.getMonth() / 3) + 1
      from.setMonth((q - 1) * 3, 1)
      from.setHours(0, 0, 0, 0)
      break
  }
  return { from, to }
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
      .select('id, label, format, currency, cached_value, refresh_seconds, source_type, query_config')
      .eq('org_id', org.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
    }

    const formatted = await Promise.all(
      (kpis ?? []).map(async (k) => {
        const cached = k.cached_value as { value?: number } | null
        const qc = (k.query_config ?? {}) as QueryConfig
        const showLeaderboard = qc.show_leaderboard ?? false
        const goal = qc.goal ?? null

        let value: number | null = cached?.value ?? null
        let leaders: Leader[] = []

        if (showLeaderboard) {
          if (k.source_type === 'celebration_aggregate') {
            const templateIds = (qc.template_ids ?? []) as string[]
            const period = qc.period ?? 'quarter'
            const { from, to } = getPeriodBounds(period)

            const { data: celebrations } = await supabase
              .from('celebrations')
              .select('id, amount, team_member_ids, template_id')
              .eq('org_id', org.id)
              .gte('created_at', from.toISOString())
              .lte('created_at', to.toISOString())
              .in('status', ['pending', 'displayed'])

            const memberTotals: Record<string, number> = {}
            let total = 0

            for (const c of celebrations ?? []) {
              const tid = (c as { template_id?: string }).template_id
              if (templateIds.length > 0 && tid && !templateIds.includes(tid)) continue

              const amt = Number((c as { amount?: unknown }).amount ?? 0)
              const ids = (c as { team_member_ids?: string[] }).team_member_ids ?? []
              total += amt
              if (ids.length > 0) {
                const share = amt / ids.length
                for (const id of ids) {
                  if (id) memberTotals[id] = (memberTotals[id] ?? 0) + share
                }
              }
            }

            if (value == null) value = total
            const sorted = Object.entries(memberTotals)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)

            if (sorted.length > 0) {
              const memberIds = sorted.map(([id]) => id)
              const { data: members } = await supabase
                .from('team_members')
                .select('id, name, photo_url')
                .in('id', memberIds)
              const map = new Map((members ?? []).map((m) => [m.id, m]))
              leaders = sorted.map(([id, v]) => {
                const m = map.get(id)
                return {
                  id,
                  name: m?.name ?? 'Unknown',
                  photo_url: m?.photo_url ?? null,
                  value: v,
                }
              })
            }
          } else if (k.source_type === 'manual' && qc.leader_overrides?.length) {
            const overrides = qc.leader_overrides
              .slice()
              .sort((a, b) => b.value - a.value)
              .slice(0, 3)
            const memberIds = overrides.map((o) => o.team_member_id)
            const { data: members } = await supabase
              .from('team_members')
              .select('id, name, photo_url')
              .in('id', memberIds)
            const map = new Map((members ?? []).map((m) => [m.id, m]))
            leaders = overrides.map((o) => {
              const m = map.get(o.team_member_id)
              return {
                id: o.team_member_id,
                name: m?.name ?? 'Unknown',
                photo_url: m?.photo_url ?? null,
                value: o.value,
              }
            })
          }
        }

        return {
          id: k.id,
          label: k.label,
          format: k.format ?? 'number',
          currency: k.currency ?? 'CAD',
          value,
          goal,
          leaders: leaders.length > 0 ? leaders : undefined,
          refresh_seconds: k.refresh_seconds ?? 300,
        }
      })
    )

    return NextResponse.json({ kpis: formatted })
  } catch (err) {
    console.error('Display KPIs error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
