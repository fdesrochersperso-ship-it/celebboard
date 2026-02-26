import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest } from 'next/server'

const COMPANIES = [
  'Acme Corp',
  'TechFlow Inc',
  'Maple Digital',
  'Northern Solutions',
  'BlueWave Media',
  'Summit AI',
  'GreenPath Analytics',
  'Atlas Consulting',
  'Velocity Labs',
  'Horizon Partners',
]

const OWNER_IDS = ['100001', '100002', '100003', '100004', '100005']

const OWNER_NAMES: Record<string, string> = {
  '100001': 'Francis Dufresne',
  '100002': 'Marie-Claire Bouchard',
  '100003': 'Jean-Philippe Tremblay',
  '100004': 'Sarah Chen',
  '100005': 'Alex Rodriguez',
}

function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 12)
}

type Scenario = 'deal_won' | 'new_client' | 'contract_signed' | 'renewal' | 'random'

function buildPayload(scenario: Scenario): Record<string, unknown> {
  const resolvedScenario = scenario === 'random'
    ? (['deal_won', 'new_client', 'contract_signed', 'renewal'] as const)[Math.floor(Math.random() * 4)]
    : scenario

  const company = random(COMPANIES)
  const ownerId = random(OWNER_IDS)
  const objectId = randomId()

  switch (resolvedScenario) {
    case 'deal_won':
      return {
        objectId,
        event_type: 'deal.won',
        dealname: `${company} Annual Contract`,
        amount: randomInt(5000, 150000),
        company,
        hubspot_owner_id: ownerId,
        account_manager_id: random(OWNER_IDS),
        owner_name: OWNER_NAMES[ownerId] ?? 'Team Member',
      }
    case 'new_client':
      return {
        objectId,
        event_type: 'deal.created',
        dealname: `${company} Onboarding`,
        company,
        hubspot_owner_id: ownerId,
        owner_name: OWNER_NAMES[ownerId] ?? 'Team Member',
      }
    case 'contract_signed':
      return {
        objectId,
        event_type: 'quote.signed',
        dealname: `${company} Q1 Agreement`,
        amount: randomInt(10000, 200000),
        company,
        hubspot_owner_id: ownerId,
        owner_name: OWNER_NAMES[ownerId] ?? 'Team Member',
      }
    case 'renewal':
      return {
        objectId,
        event_type: 'renewal.signed',
        dealname: `${company} Renewal 2025`,
        renewal_value: randomInt(5000, 80000),
        hubspot_owner_id: ownerId,
        company,
        owner_name: OWNER_NAMES[ownerId] ?? 'Team Member',
      }
    default:
      return buildPayload('deal_won')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, scenario } = body

    if (!orgId || typeof orgId !== 'string') {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })
    }

    const validScenarios = ['deal_won', 'new_client', 'contract_signed', 'renewal', 'random']
    if (scenario && !validScenarios.includes(scenario)) {
      return NextResponse.json(
        { error: `Invalid scenario. Use one of: ${validScenarios.join(', ')}` },
        { status: 400 }
      )
    }

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
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await supabaseAuth
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', orgId)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this org' }, { status: 403 })
    }

    const payload = buildPayload((scenario as Scenario) ?? 'random')

    const baseUrl = request.nextUrl.origin
    const webhookUrl = `${baseUrl}/api/webhooks/${orgId}/hubspot`

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      payload,
      webhook_response: data,
    })
  } catch (err) {
    console.error('Simulate error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
