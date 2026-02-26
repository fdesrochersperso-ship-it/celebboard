import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { CELEBRATION_PRESETS } from '@/lib/celebrations/presets'

const TEAM_MEMBERS = [
  { name: 'Francis Dufresne', email: 'francis@company.com', hubspot_owner_id: '100001', slack_user_id: 'U001' },
  { name: 'Marie-Claire Bouchard', email: 'marie-claire@company.com', hubspot_owner_id: '100002', slack_user_id: 'U002' },
  { name: 'Jean-Philippe Tremblay', email: 'jp@company.com', hubspot_owner_id: '100003', slack_user_id: 'U003' },
  { name: 'Sarah Chen', email: 'sarah@company.com', hubspot_owner_id: '100004', slack_user_id: 'U004' },
  { name: 'Alex Rodriguez', email: 'alex@company.com', hubspot_owner_id: '100005', slack_user_id: 'U005' },
]

const TEMPLATE_PRESET_IDS = ['deal-won', 'new-client', 'contract-signed', 'renewal'] as const

const TEMPLATE_PHOTO_FIELDS: Record<string, string[]> = {
  'Deal Won': ['owner_id', 'account_manager_id'],
  'New Client': ['owner_id'],
  'Contract Signed': ['owner_id'],
  Renewal: ['owner_id'],
}

const TRIGGERS: Record<string, { event_type: string; conditions: { field: string; op: string; value: string }[]; field_mapping: Record<string, string> }> = {
  'Deal Won': {
    event_type: 'deal.won',
    conditions: [{ field: 'event_type', op: 'eq', value: 'deal.won' }],
    field_mapping: {
      deal_name: 'dealname',
      amount: 'amount',
      company_name: 'company',
      owner_id: 'hubspot_owner_id',
      owner_name: 'owner_name',
      account_manager_id: 'account_manager_id',
    },
  },
  'New Client': {
    event_type: 'deal.created',
    conditions: [{ field: 'event_type', op: 'eq', value: 'deal.created' }],
    field_mapping: {
      deal_name: 'dealname',
      company_name: 'company',
      owner_id: 'hubspot_owner_id',
      owner_name: 'owner_name',
    },
  },
  'Contract Signed': {
    event_type: 'quote.signed',
    conditions: [{ field: 'event_type', op: 'eq', value: 'quote.signed' }],
    field_mapping: {
      deal_name: 'dealname',
      amount: 'amount',
      company_name: 'company',
      owner_id: 'hubspot_owner_id',
      owner_name: 'owner_name',
    },
  },
  Renewal: {
    event_type: 'renewal.signed',
    conditions: [{ field: 'event_type', op: 'eq', value: 'renewal.signed' }],
    field_mapping: {
      deal_name: 'dealname',
      amount: 'renewal_value',
      company_name: 'company',
      owner_id: 'hubspot_owner_id',
      owner_name: 'owner_name',
    },
  },
}

const KPI_DEFINITIONS = [
  { name: 'Revenue This Quarter', label: 'Revenue This Quarter', format: 'currency', cached_value: 450000 },
  { name: 'Deals Closed', label: 'Deals Closed', format: 'number', cached_value: 23 },
  { name: 'New Clients', label: 'New Clients', format: 'number', cached_value: 12 },
  { name: 'Pipeline Value', label: 'Pipeline Value', format: 'currency', cached_value: 890000 },
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId } = body

    if (!orgId || typeof orgId !== 'string') {
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 })
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

    const supabase = createServiceClient()

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const summary = { team_members: 0, integrations: 0, templates: 0, triggers: 0, kpis: 0 }

    const { data: existingMembers } = await supabase
      .from('team_members')
      .select('id')
      .eq('org_id', orgId)
      .limit(1)

    if (!existingMembers?.length) {
      for (const m of TEAM_MEMBERS) {
        await supabase.from('team_members').insert({
          org_id: orgId,
          name: m.name,
          email: m.email,
          external_ids: {
            hubspot_owner_id: m.hubspot_owner_id,
            slack_user_id: m.slack_user_id,
            account_manager_id: m.hubspot_owner_id,
          },
        })
        summary.team_members++
      }
    }

    const integrationNames = [
      { type: 'hubspot', name: 'HubSpot' },
      { type: 'slack', name: 'Slack' },
      { type: 'generic_webhook', name: 'Generic Webhook' },
    ]

    for (const { type, name } of integrationNames) {
      const { data: existing } = await supabase
        .from('integrations')
        .select('id')
        .eq('org_id', orgId)
        .eq('type', type)
        .eq('name', name)
        .maybeSingle()

      if (!existing) {
        await supabase.from('integrations').insert({
          org_id: orgId,
          type,
          name,
          credentials: {},
          status: 'active',
          ...(type === 'generic_webhook' ? { webhook_secret: randomBytes(32).toString('hex') } : {}),
        })
        summary.integrations++
      }
    }

    const { data: hubspotIntegration } = await supabase
      .from('integrations')
      .select('id')
      .eq('org_id', orgId)
      .eq('type', 'hubspot')
      .eq('name', 'HubSpot')
      .single()

    const templateIds: Record<string, string> = {}

    for (const presetId of TEMPLATE_PRESET_IDS) {
      const preset = CELEBRATION_PRESETS.find((p) => p.id === presetId)
      if (!preset) continue

      const { data: existing } = await supabase
        .from('celebration_templates')
        .select('id')
        .eq('org_id', orgId)
        .eq('name', preset.name)
        .maybeSingle()

      if (existing) {
        templateIds[preset.name] = existing.id
      } else {
        const { data: created } = await supabase
          .from('celebration_templates')
          .insert({
            org_id: orgId,
            name: preset.name,
            title_pattern: preset.title_pattern,
            subtitle_pattern: preset.subtitle_pattern,
            visual_style: preset.visual_style,
            sound: preset.sound,
            duration_seconds: preset.duration_seconds,
            show_counter: preset.show_counter,
            show_photos: preset.show_photos,
            photo_fields: TEMPLATE_PHOTO_FIELDS[preset.name] ?? ['owner_id'],
            is_active: true,
          })
          .select('id')
          .single()

        if (created) {
          templateIds[preset.name] = created.id
          summary.templates++
        }
      }
    }

    if (hubspotIntegration) {
      for (const [templateName, triggerConfig] of Object.entries(TRIGGERS)) {
        const templateId = templateIds[templateName]
        if (!templateId) continue

        const { data: existing } = await supabase
          .from('celebration_triggers')
          .select('id')
          .eq('template_id', templateId)
          .eq('integration_id', hubspotIntegration.id)
          .eq('name', `HubSpot ${templateName}`)
          .maybeSingle()

        if (!existing) {
          await supabase.from('celebration_triggers').insert({
            org_id: orgId,
            integration_id: hubspotIntegration.id,
            template_id: templateId,
            name: `HubSpot ${templateName}`,
            event_type: triggerConfig.event_type,
            conditions: triggerConfig.conditions,
            field_mapping: triggerConfig.field_mapping,
            is_active: true,
          })
          summary.triggers++
        }
      }
    }

    for (const kpi of KPI_DEFINITIONS) {
      const { data: existing } = await supabase
        .from('kpi_definitions')
        .select('id')
        .eq('org_id', orgId)
        .eq('name', kpi.name)
        .maybeSingle()

      if (!existing) {
        await supabase.from('kpi_definitions').insert({
          org_id: orgId,
          name: kpi.name,
          label: kpi.label,
          source_type: 'manual',
          format: kpi.format,
          currency: 'CAD',
          show_trend: true,
          trend_period: 'quarter',
          is_active: true,
          cached_value: { value: kpi.cached_value },
          cached_at: new Date().toISOString(),
          refresh_seconds: 300,
        })
        summary.kpis++
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Seed completed',
      created: summary,
    })
  } catch (err) {
    console.error('Seed error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
