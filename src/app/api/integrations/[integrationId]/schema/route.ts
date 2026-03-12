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

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { integrationId } = await params
  const supabase = createServiceClient()

  const access = await validateOrgAccess(request, integrationId, supabase)
  if (access.error) return access.error
  const integration = access.integration!
  if (integration.type !== 'hubspot') {
    return NextResponse.json(
      { error: 'Schema API only supports HubSpot integrations' },
      { status: 400 }
    )
  }

  const type = request.nextUrl.searchParams.get('type')
  const objectType = request.nextUrl.searchParams.get('objectType')

  try {
    let query = supabase
      .from('integration_schemas')
      .select('schema_type, object_type, data, fetched_at, expires_at')
      .eq('integration_id', integrationId)

    if (type) {
      query = query.eq('schema_type', type)
    }
    if (objectType) {
      query = query.eq('object_type', objectType)
    }

    const { data: rows, error } = await query

    if (error) {
      console.error('Schema GET error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const now = new Date()
    let needsRefresh = (rows ?? []).length === 0

    for (const row of rows ?? []) {
      const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0
      if (expiresAt < now.getTime()) {
        needsRefresh = true
        break
      }
    }

    // If expired, trigger background refresh (don't await) and return stale data
    if (needsRefresh) {
      fetchAndCacheAllSchemas(integrationId, integration.org_id, supabase).catch((err) => {
        console.error('Background schema refresh failed:', err)
      })
    }

    const schemas = (rows ?? []).map((r) => ({
      schema_type: r.schema_type,
      object_type: r.object_type || null,
      data: r.data,
      fetched_at: r.fetched_at,
      expires_at: r.expires_at,
    }))

    return NextResponse.json({ schemas })
  } catch (err) {
    console.error('Schema GET error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch schema' },
      { status: 500 }
    )
  }
}
