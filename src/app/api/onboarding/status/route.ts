import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

type StepId =
  | 'connect_integration'
  | 'add_team'
  | 'create_celebration'
  | 'create_kpi'

type StepDefinition = {
  id: StepId
  title: string
  description: string
  href: string
  ctaLabel: string
}

const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: 'connect_integration',
    title: 'Connect an integration',
    description: 'Start with HubSpot, Slack, or a webhook source.',
    href: '/app/integrations',
    ctaLabel: 'Open integrations',
  },
  {
    id: 'add_team',
    title: 'Add team members',
    description: 'Import owners or add the people who should appear on celebrations.',
    href: '/app/team',
    ctaLabel: 'Open team',
  },
  {
    id: 'create_celebration',
    title: 'Create a celebration rule',
    description: 'Choose the event, map fields, and design what shows on the TV.',
    href: '/app/celebrations/new',
    ctaLabel: 'Create celebration',
  },
  {
    id: 'create_kpi',
    title: 'Add a KPI card',
    description: 'Show a metric so the display has useful context between celebrations.',
    href: '/app/kpis/new',
    ctaLabel: 'Create KPI',
  },
]

async function getTableCount(
  table: string,
  orgId: string,
  supabase: ReturnType<typeof createServiceClient>
) {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)

  if (error) {
    throw error
  }

  return count ?? 0
}

function formatCount(count: number, singular: string, plural: string = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export async function GET(request: NextRequest) {
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

    const { data: membership, error: membershipError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (membershipError) {
      throw membershipError
    }

    if (!membership?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, display_token')
      .eq('id', membership.org_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const [
      integrationsCount,
      teamMembersCount,
      celebrationRulesCount,
      kpisCount,
      celebrationsCount,
    ] = await Promise.all([
      getTableCount('integrations', org.id, supabase),
      getTableCount('team_members', org.id, supabase),
      getTableCount('celebration_triggers', org.id, supabase),
      getTableCount('kpi_definitions', org.id, supabase),
      getTableCount('celebrations', org.id, supabase),
    ])

    const completedMap: Record<StepId, boolean> = {
      connect_integration: integrationsCount > 0,
      add_team: teamMembersCount > 0,
      create_celebration: celebrationRulesCount > 0,
      create_kpi: kpisCount > 0,
    }

    const detailMap: Record<StepId, string> = {
      connect_integration:
        integrationsCount > 0
          ? formatCount(integrationsCount, 'integration')
          : 'No integrations connected yet',
      add_team:
        teamMembersCount > 0
          ? formatCount(teamMembersCount, 'team member')
          : 'No team members added yet',
      create_celebration:
        celebrationRulesCount > 0
          ? formatCount(celebrationRulesCount, 'celebration rule')
          : 'No celebration rules configured yet',
      create_kpi:
        kpisCount > 0 ? formatCount(kpisCount, 'KPI') : 'No KPI cards configured yet',
    }

    const steps = STEP_DEFINITIONS.map((step) => ({
      ...step,
      completed: completedMap[step.id],
      detail: detailMap[step.id],
    }))

    const completedSteps = steps.filter((step) => step.completed).length
    const totalSteps = steps.length
    const nextStep = steps.find((step) => !step.completed) ?? null

    return NextResponse.json({
      org: {
        id: org.id,
        name: org.name,
        display_url: `${request.nextUrl.origin}/display/${org.display_token}`,
      },
      counts: {
        integrations: integrationsCount,
        team_members: teamMembersCount,
        celebration_rules: celebrationRulesCount,
        kpis: kpisCount,
        celebrations: celebrationsCount,
      },
      progress: {
        completed_steps: completedSteps,
        total_steps: totalSteps,
        percent: Math.round((completedSteps / totalSteps) * 100),
      },
      next_step: nextStep,
      steps,
    })
  } catch (err) {
    console.error('Onboarding status error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
