import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import {
  evaluateConditions,
  applyFieldMapping,
  renderTemplate,
  resolveTeamMembers,
} from '@/lib/webhooks/process-webhook'

type RouteContext = {
  params: Promise<{ orgId: string; type: string }>
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { orgId, type } = await params

    if (!orgId || !type || type === 'test') {
      return NextResponse.json({ error: 'Invalid webhook path' }, { status: 400 })
    }

    let payload: Record<string, unknown>
    try {
      payload = (await request.json()) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
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

    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('id, webhook_secret')
      .eq('org_id', orgId)
      .eq('type', type)
      .eq('status', 'active')

    if (intError || !integrations?.length) {
      return NextResponse.json(
        { error: `No active integration found for type: ${type}` },
        { status: 404 }
      )
    }

    let integrationsToProcess = integrations
    if (type === 'generic_webhook' || type === 'generic') {
      const secret = request.headers.get('x-webhook-secret')
      const withSecret = integrations.filter((i) => i.webhook_secret)
      if (withSecret.length > 0) {
        if (!secret) {
          return NextResponse.json({ error: 'Missing X-Webhook-Secret header' }, { status: 401 })
        }
        integrationsToProcess = integrations.filter((i) => i.webhook_secret === secret)
        if (integrationsToProcess.length === 0) {
          return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
        }
      }
    }

    const created: string[] = []

    for (const integration of integrationsToProcess) {
      const { data: triggers, error: triggersError } = await supabase
        .from('celebration_triggers')
        .select(`
          id,
          template_id,
          conditions,
          field_mapping,
          celebration_templates (
            id,
            title_pattern,
            subtitle_pattern,
            photo_fields
          )
        `)
        .eq('integration_id', integration.id)
        .eq('is_active', true)

      if (triggersError || !triggers?.length) continue

      for (const trigger of triggers) {
        const conditions = (trigger.conditions as unknown[]) ?? []
        if (!evaluateConditions(conditions as { field: string; op: string; value: unknown }[], payload)) {
          continue
        }

        const mapping = (trigger.field_mapping as Record<string, string>) ?? {}
        const extracted = applyFieldMapping(mapping, payload)
        const template = trigger.celebration_templates as {
          title_pattern: string
          subtitle_pattern: string | null
          photo_fields: string[] | null
        } | null

        if (!template) continue

        const title = renderTemplate(template.title_pattern, extracted)
        const subtitle = template.subtitle_pattern
          ? renderTemplate(template.subtitle_pattern, extracted)
          : null

        const amountRaw = extracted.amount ?? extracted.value
        const amount =
          typeof amountRaw === 'number' ? amountRaw : typeof amountRaw === 'string' ? parseFloat(amountRaw) : null

        const photoFields = (template.photo_fields as string[]) ?? []
        const externalIds: Record<string, string> = {}
        for (const field of photoFields) {
          const path = mapping[field] ?? field
          const val = extracted[field] ?? getNestedValue(payload, path)
          if (val != null && val !== '') {
            externalIds[path] = String(val)
          }
        }

        const teamMemberIds = await resolveTeamMembers(externalIds, orgId, supabase)
        const externalId = String(extracted.external_id ?? extracted.id ?? crypto.randomUUID())

        const { data: celebration, error: insertError } = await supabase
          .from('celebrations')
          .insert({
            org_id: orgId,
            template_id: trigger.template_id,
            trigger_id: trigger.id,
            title,
            subtitle,
            amount: amount && !isNaN(amount) ? amount : null,
            team_member_ids: teamMemberIds,
            metadata: extracted,
            status: 'pending',
            external_id: externalId,
          })
          .select('id')
          .single()

        if (!insertError && celebration) {
          created.push(celebration.id)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      created: created.length,
      celebration_ids: created,
    })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}
