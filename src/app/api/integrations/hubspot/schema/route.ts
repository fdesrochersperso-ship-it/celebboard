import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { getSchemaForOrg } from '@/lib/connectors/hubspot/schema'
import { syncHubSpotSchema } from '@/lib/connectors/hubspot/schema'
import { type NextRequest } from 'next/server'

async function validateOrgAccess(
  request: NextRequest,
  orgId: string,
  supabase: ReturnType<typeof createServiceClient>
) {
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
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', orgId)
    .maybeSingle()

  if (!membership) {
    return {
      error: NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      ),
    }
  }

  return { error: null }
}

export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get('org_id')
  if (!orgId) {
    return NextResponse.json(
      { error: 'Missing org_id query parameter' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const access = await validateOrgAccess(request, orgId, supabase)
  if (access.error) return access.error

  try {
    const { data: integration } = await supabase
      .from('integrations')
      .select('id')
      .eq('org_id', orgId)
      .eq('type', 'hubspot')
      .maybeSingle()

    if (!integration) {
      return NextResponse.json(
        { error: 'No HubSpot integration found for this organization' },
        { status: 404 }
      )
    }

    const objects = await getSchemaForOrg(orgId, integration.id, supabase)
    return NextResponse.json({ objects })
  } catch (err) {
    console.error('HubSpot schema GET error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch schema' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get('org_id')
  if (!orgId) {
    return NextResponse.json(
      { error: 'Missing org_id query parameter' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const access = await validateOrgAccess(request, orgId, supabase)
  if (access.error) return access.error

  try {
    const { data: integration, error: intError } = await supabase
      .from('integrations')
      .select('id, org_id, credentials')
      .eq('org_id', orgId)
      .eq('type', 'hubspot')
      .single()

    if (intError || !integration) {
      return NextResponse.json(
        { error: 'No HubSpot integration found for this organization' },
        { status: 404 }
      )
    }

    // DEBUG: Log credentials structure to diagnose token issues
    const creds = integration.credentials as Record<string, unknown> | null | undefined
    console.log('[HubSpot schema POST] Integration record:', {
      id: integration.id,
      org_id: integration.org_id,
      credentials_type: typeof integration.credentials,
      credentials_keys: creds ? Object.keys(creds) : [],
      has_access_token: !!creds?.access_token,
      has_refresh_token: !!creds?.refresh_token,
    })

    await syncHubSpotSchema(integration, orgId, supabase)
    return NextResponse.json({
      success: true,
      message: 'Schema refreshed',
    })
  } catch (err) {
    console.error('HubSpot schema POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to refresh schema' },
      { status: 500 }
    )
  }
}
