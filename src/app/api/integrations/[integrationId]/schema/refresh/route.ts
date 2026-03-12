import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase-server'
import { fetchAndCacheAllSchemas } from '@/lib/connectors/hubspot'
import type { NextRequest } from 'next/server'

type RouteContext = {
  params: Promise<{ integrationId: string }>
}

async function validateOrgAccess(
  request: NextRequest,
  integrationId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<{ error?: NextResponse; integration?: { id: string; org_id: string; type: string } }> {
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

  const { data: integration, error: intError } = await supabase
    .from('integrations')
    .select('id, org_id, type')
    .eq('id', integrationId)
    .single()

  if (intError || !integration) {
    return { error: NextResponse.json({ error: 'Integration not found' }, { status: 404 }) }
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .eq('org_id', integration.org_id)
    .maybeSingle()

  if (!membership) {
    return {
      error: NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      ),
    }
  }

  return { integration }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { integrationId } = await params
  const supabase = createServiceClient()

  const access = await validateOrgAccess(request, integrationId, supabase)
  if (access.error) return access.error
  const integration = access.integration!
  if (integration.type !== 'hubspot') {
    return NextResponse.json(
      { error: 'Schema refresh only supports HubSpot integrations' },
      { status: 400 }
    )
  }

  try {
    await fetchAndCacheAllSchemas(integrationId, integration.org_id, supabase)

    const { data: rows } = await supabase
      .from('integration_schemas')
      .select('schema_type, object_type, fetched_at')
      .eq('integration_id', integrationId)

    return NextResponse.json({
      success: true,
      message: 'Schema refreshed',
      schemas: (rows ?? []).map((r) => ({
        schema_type: r.schema_type,
        object_type: r.object_type || null,
        fetched_at: r.fetched_at,
      })),
    })
  } catch (err) {
    console.error('Schema refresh error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to refresh schema' },
      { status: 500 }
    )
  }
}
