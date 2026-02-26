import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { syncTeamMembers as syncHubSpot } from '@/lib/connectors/hubspot'
import { syncTeamMembers as syncSlack } from '@/lib/connectors/slack'
import { type NextRequest } from 'next/server'

type RouteContext = {
  params: Promise<{ integrationId: string }>
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { integrationId } = await params

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

    const supabase = createServiceClient()
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('id, org_id, type, credentials')
      .eq('id', integrationId)
      .single()

    if (intError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const { data: membership } = await supabaseAuth
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('org_id', integration.org_id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    if (integration.type !== 'hubspot' && integration.type !== 'slack') {
      return NextResponse.json(
        { error: `Sync not supported for ${integration.type}` },
        { status: 400 }
      )
    }

    const result =
      integration.type === 'hubspot'
        ? await syncHubSpot(integration, integration.org_id, supabase)
        : await syncSlack(integration, integration.org_id, supabase)

    await supabase
      .from('integrations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', integrationId)

    return NextResponse.json({
      ok: true,
      created: result.created,
      updated: result.updated,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    console.error('Integration sync error:', err)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
