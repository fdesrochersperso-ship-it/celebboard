import type { SupabaseClient } from '@supabase/supabase-js'
import { getValidToken } from './auth'

const HUBSPOT_API_BASE = 'https://api.hubapi.com'
const CACHE_TTL_HOURS = 24
const MAX_OWNERS_PAGES = 100

type HubSpotPropertiesResponse = {
  results?: Array<{
    name?: string
    label?: string
    type?: string
    fieldType?: string
    groupName?: string
    description?: string
    options?: Array<{ label?: string; value?: string; displayOrder?: number }>
    [key: string]: unknown
  }>
}

type HubSpotPipelinesResponse = {
  results?: Array<{
    id?: string
    label?: string
    stages?: Array<{
      id?: string
      label?: string
      displayOrder?: number
    }>
    [key: string]: unknown
  }>
}

type HubSpotOwnersResponse = {
  results?: Array<{
    id?: string
    email?: string
    firstName?: string
    lastName?: string
    archived?: boolean
    [key: string]: unknown
  }>
  paging?: { next?: { after?: string } }
}

async function fetchHubSpot(
  endpoint: string,
  accessToken: string,
  params?: Record<string, string>
): Promise<Response> {
  const url = new URL(`${HUBSPOT_API_BASE}/${endpoint.replace(/^\//, '')}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  return fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
}

// -----------------------------------------------------------------------------
// Raw fetch functions (take accessToken directly)
// -----------------------------------------------------------------------------

export async function fetchDealProperties(accessToken: string): Promise<HubSpotPropertiesResponse> {
  const res = await fetchHubSpot('crm/v3/properties/deals', accessToken)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HubSpot deal properties failed ${res.status}: ${text}`)
  }
  return res.json() as Promise<HubSpotPropertiesResponse>
}

export async function fetchContactProperties(accessToken: string): Promise<HubSpotPropertiesResponse> {
  const res = await fetchHubSpot('crm/v3/properties/contacts', accessToken)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HubSpot contact properties failed ${res.status}: ${text}`)
  }
  return res.json() as Promise<HubSpotPropertiesResponse>
}

export async function fetchCompanyProperties(accessToken: string): Promise<HubSpotPropertiesResponse> {
  const res = await fetchHubSpot('crm/v3/properties/companies', accessToken)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HubSpot company properties failed ${res.status}: ${text}`)
  }
  return res.json() as Promise<HubSpotPropertiesResponse>
}

export async function fetchPipelines(accessToken: string): Promise<HubSpotPipelinesResponse> {
  const res = await fetchHubSpot('crm/v3/pipelines/deals', accessToken)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HubSpot pipelines failed ${res.status}: ${text}`)
  }
  return res.json() as Promise<HubSpotPipelinesResponse>
}

export async function fetchOwners(accessToken: string): Promise<HubSpotOwnersResponse> {
  const allResults: HubSpotOwnersResponse['results'] = []
  let after: string | undefined

  for (let page = 0; page < MAX_OWNERS_PAGES; page++) {
    const params: Record<string, string> = { limit: '100' }
    if (after) params.after = after

    const res = await fetchHubSpot('crm/v3/owners', accessToken, params)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`HubSpot owners failed ${res.status}: ${text}`)
    }

    const data = (await res.json()) as HubSpotOwnersResponse
    const results = data.results ?? []
    allResults.push(...results)

    after = data.paging?.next?.after
    if (!after || results.length === 0) break
  }

  return { results: allResults }
}

// -----------------------------------------------------------------------------
// Orchestrator: fetch all schemas and upsert into integration_schemas
// -----------------------------------------------------------------------------

type Integration = {
  id: string
  credentials?: Record<string, unknown> | string | null
}

function normalizeCredentials(raw: unknown): Record<string, unknown> {
  if (raw == null) return {}
  if (typeof raw === 'string') {
    try {
      return (JSON.parse(raw) as Record<string, unknown>) ?? {}
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

function upsertSchema(
  supabase: SupabaseClient,
  row: {
    org_id: string
    integration_id: string
    schema_type: string
    object_type: string
    data: unknown
    fetched_at: string
    expires_at: string
  }
) {
  return supabase.from('integration_schemas').upsert(
    {
      ...row,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'integration_id,schema_type,object_type',
    }
  )
}

export async function fetchAndCacheAllSchemas(
  integrationId: string,
  orgId: string,
  supabase: SupabaseClient
): Promise<void> {
  const { data: integration, error: intError } = await supabase
    .from('integrations')
    .select('id, credentials')
    .eq('id', integrationId)
    .single()

  if (intError || !integration) {
    throw new Error(`Integration ${integrationId} not found`)
  }

  const creds = normalizeCredentials(integration.credentials)
  const integrationForToken: Integration = {
    id: integrationId,
    credentials: creds,
  }

  const accessToken = await getValidToken(integrationForToken, supabase)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CACHE_TTL_HOURS * 60 * 60 * 1000)
  const fetchedAt = now.toISOString()
  const expiresAtStr = expiresAt.toISOString()

  // Properties: deals, contacts, companies
  const [dealsProps, contactsProps, companiesProps, pipelines, owners] = await Promise.all([
    fetchDealProperties(accessToken),
    fetchContactProperties(accessToken),
    fetchCompanyProperties(accessToken),
    fetchPipelines(accessToken),
    fetchOwners(accessToken),
  ])

  const upserts = [
    upsertSchema(supabase, {
      org_id: orgId,
      integration_id: integrationId,
      schema_type: 'properties',
      object_type: 'deals',
      data: dealsProps,
      fetched_at: fetchedAt,
      expires_at: expiresAtStr,
    }),
    upsertSchema(supabase, {
      org_id: orgId,
      integration_id: integrationId,
      schema_type: 'properties',
      object_type: 'contacts',
      data: contactsProps,
      fetched_at: fetchedAt,
      expires_at: expiresAtStr,
    }),
    upsertSchema(supabase, {
      org_id: orgId,
      integration_id: integrationId,
      schema_type: 'properties',
      object_type: 'companies',
      data: companiesProps,
      fetched_at: fetchedAt,
      expires_at: expiresAtStr,
    }),
    upsertSchema(supabase, {
      org_id: orgId,
      integration_id: integrationId,
      schema_type: 'pipelines',
      object_type: '', // no CRM object type for pipelines
      data: pipelines,
      fetched_at: fetchedAt,
      expires_at: expiresAtStr,
    }),
    upsertSchema(supabase, {
      org_id: orgId,
      integration_id: integrationId,
      schema_type: 'owners',
      object_type: '', // no CRM object type for owners
      data: owners,
      fetched_at: fetchedAt,
      expires_at: expiresAtStr,
    }),
  ]

  const results = await Promise.all(upserts)
  for (const r of results) {
    if (r.error) {
      throw new Error(`Failed to cache schema: ${r.error.message}`)
    }
  }

  // Update integrations.config.schema_last_synced
  const { data: existingIntegration } = await supabase
    .from('integrations')
    .select('config')
    .eq('id', integrationId)
    .single()

  const currentConfig = (existingIntegration?.config as Record<string, unknown>) ?? {}
  const updatedConfig = {
    ...currentConfig,
    schema_last_synced: new Date().toISOString(),
  }

  await supabase
    .from('integrations')
    .update({
      config: updatedConfig,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId)
}

// -----------------------------------------------------------------------------
// getCachedSchemasForOrg — for legacy /api/integrations/hubspot/schema GET
// -----------------------------------------------------------------------------

export async function getCachedSchemasForOrg(
  orgId: string,
  integrationId: string,
  supabase: SupabaseClient
): Promise<
  Array<{
    schema_type: string
    object_type: string | null
    data: unknown
    fetched_at: string | null
    expires_at: string | null
  }>
> {
  const { data: rows, error } = await supabase
    .from('integration_schemas')
    .select('schema_type, object_type, data, fetched_at, expires_at')
    .eq('org_id', orgId)
    .eq('integration_id', integrationId)

  if (error) {
    throw new Error(`Failed to fetch schema: ${error.message}`)
  }

  return (rows ?? []).map((r) => ({
    schema_type: r.schema_type,
    object_type: r.object_type === '' ? null : r.object_type,
    data: r.data,
    fetched_at: r.fetched_at,
    expires_at: r.expires_at,
  }))
}
