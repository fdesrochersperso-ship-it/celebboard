import type { SupabaseClient } from '@supabase/supabase-js'
import { hubspotApi } from './api'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CleanedProperty {
  name: string
  label: string
  type: string
  fieldType: string
  groupName: string
  description: string
  options: Array<{ label: string; value: string }>
}

export interface PipelineStage {
  id: string
  label: string
}

export interface ObjectSchema {
  objectType: string
  objectLabel: string
  properties: CleanedProperty[]
  pipelineStages: Array<{
    pipelineId: string
    pipelineName: string
    stages: PipelineStage[]
  }>
}

type RawProperty = {
  name?: string
  label?: string
  type?: string
  fieldType?: string
  groupName?: string
  description?: string
  options?: Array<{ label?: string; value?: string }>
  calculated?: boolean
  hidden?: boolean
  [key: string]: unknown
}

type RawPipeline = {
  id?: string
  pipelineId?: string
  label?: string
  stages?: Array<{
    id?: string
    stageId?: string
    label?: string
    displayOrder?: number
  }>
}

type RawCustomSchema = {
  objectTypeId?: string
  name?: string
  labels?: { singular?: string; plural?: string }
  [key: string]: unknown
}

// Useful HubSpot system properties to keep (users need these in trigger builder)
const USEFUL_HS_PROPERTIES = new Set([
  'hs_deal_stage_probability',
  'hs_object_id',
  'hs_createdate',
  'hs_lastmodifieddate',
  'hs_pipeline',
])

const CACHE_STALE_HOURS = 24

// -----------------------------------------------------------------------------
// 2. cleanProperties
// -----------------------------------------------------------------------------

export function cleanProperties(rawProperties: RawProperty[]): CleanedProperty[] {
  const filtered = rawProperties.filter((p) => {
    const name = p.name ?? ''
    if (!name) return false

    // Filter calculated properties (except hs_deal_stage_probability)
    if (p.calculated === true && name !== 'hs_deal_stage_probability') {
      return false
    }

    // Filter hidden hs_ properties that aren't in our useful list
    if (p.hidden === true && name.startsWith('hs_') && !USEFUL_HS_PROPERTIES.has(name)) {
      return false
    }

    return true
  })

  const cleaned: CleanedProperty[] = filtered.map((p) => ({
    name: String(p.name ?? ''),
    label: String(p.label ?? p.name ?? ''),
    type: String(p.type ?? 'string'),
    fieldType: String(p.fieldType ?? 'text'),
    groupName: String(p.groupName ?? ''),
    description: String(p.description ?? ''),
    options: (p.options ?? []).map((o) => ({
      label: String(o.label ?? o.value ?? ''),
      value: String(o.value ?? o.label ?? ''),
    })),
  }))

  cleaned.sort((a, b) => {
    const groupCompare = a.groupName.localeCompare(b.groupName)
    if (groupCompare !== 0) return groupCompare
    return a.label.localeCompare(b.label)
  })

  return cleaned
}

// -----------------------------------------------------------------------------
// 1. syncHubSpotSchema
// -----------------------------------------------------------------------------

const STANDARD_OBJECTS: Array<{ type: string; label: string }> = [
  { type: 'deals', label: 'Deals' },
  { type: 'contacts', label: 'Contacts' },
  { type: 'companies', label: 'Companies' },
]

export async function syncHubSpotSchema(
  integration: { id: string; credentials: Record<string, unknown> },
  orgId: string,
  supabase: SupabaseClient
): Promise<void> {
  const api = hubspotApi(integration, supabase)

  // Fetch deal pipelines (for deals object only)
  let dealPipelines: Array<{
    pipelineId: string
    pipelineName: string
    stages: PipelineStage[]
  }> = []
  try {
    const pipelinesData = (await api.get('crm/v3/pipelines/deals')) as {
      results?: RawPipeline[]
    }
    const pipelines = pipelinesData.results ?? []
    dealPipelines = pipelines.map((p) => {
      const pipelineId = String(p.id ?? p.pipelineId ?? '')
      const pipelineName = String(p.label ?? '')
      const stages = (p.stages ?? []).map((s) => ({
        id: String(s.id ?? s.stageId ?? ''),
        label: String(s.label ?? ''),
      }))
      return { pipelineId, pipelineName, stages }
    })
  } catch (err) {
    console.warn('HubSpot schema sync: could not fetch deal pipelines', err)
  }

  // Fetch properties for each standard object
  for (const { type, label } of STANDARD_OBJECTS) {
    try {
      const propsData = (await api.get(`crm/v3/properties/${type}`)) as
        | { results?: RawProperty[] }
        | RawProperty[]
      const rawProps = Array.isArray(propsData)
        ? propsData
        : (propsData.results ?? [])
      const properties = cleanProperties(rawProps)

      const pipelineStages = type === 'deals' ? dealPipelines : []

      await supabase.from('integration_schemas').upsert(
        {
          org_id: orgId,
          integration_id: integration.id,
          object_type: type,
          object_label: label,
          properties,
          pipeline_stages: pipelineStages,
          cached_at: new Date().toISOString(),
        },
        { onConflict: 'integration_id,object_type' }
      )
    } catch (err) {
      console.error(`HubSpot schema sync: failed to fetch ${type} properties`, err)
      throw err
    }
  }

  // Fetch custom object schemas (try/catch — may fail if customer has none)
  try {
    const schemasData = (await api.get('crm/v3/schemas')) as {
      results?: RawCustomSchema[]
    }
    const customSchemas = schemasData.results ?? []

    for (const schema of customSchemas) {
      const objectTypeId = schema.objectTypeId ?? schema.name
      if (!objectTypeId) continue

      const objectLabel =
        schema.labels?.plural ?? schema.labels?.singular ?? schema.name ?? String(objectTypeId)

      try {
        const propsData = (await api.get(
          `crm/v3/properties/${encodeURIComponent(String(objectTypeId))}`
        )) as { results?: RawProperty[] } | RawProperty[]
        const rawProps = Array.isArray(propsData)
          ? propsData
          : (propsData.results ?? [])
        const properties = cleanProperties(rawProps)

        await supabase.from('integration_schemas').upsert(
          {
            org_id: orgId,
            integration_id: integration.id,
            object_type: String(objectTypeId),
            object_label: objectLabel,
            properties,
            pipeline_stages: [],
            cached_at: new Date().toISOString(),
          },
          { onConflict: 'integration_id,object_type' }
        )
      } catch (err) {
        console.warn(
          `HubSpot schema sync: could not fetch properties for custom object ${objectTypeId}`,
          err
        )
      }
    }
  } catch (err) {
    console.warn('HubSpot schema sync: could not fetch custom object schemas', err)
  }

  // Update integrations.config.schema_last_synced
  const { data: existingIntegration } = await supabase
    .from('integrations')
    .select('config')
    .eq('id', integration.id)
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
    .eq('id', integration.id)
}

// -----------------------------------------------------------------------------
// 3. getSchemaForOrg
// -----------------------------------------------------------------------------

export async function getSchemaForOrg(
  orgId: string,
  integrationId: string,
  supabase: SupabaseClient
): Promise<ObjectSchema[]> {
  const { data: rows, error } = await supabase
    .from('integration_schemas')
    .select('object_type, object_label, properties, pipeline_stages, cached_at')
    .eq('org_id', orgId)
    .eq('integration_id', integrationId)

  if (error) {
    throw new Error(`Failed to fetch schema: ${error.message}`)
  }

  const schemas: ObjectSchema[] = (rows ?? []).map((r) => ({
    objectType: r.object_type ?? '',
    objectLabel: r.object_label ?? '',
    properties: (r.properties ?? []) as CleanedProperty[],
    pipelineStages: (r.pipeline_stages ?? []) as ObjectSchema['pipelineStages'],
  }))

  // Log warning if cache is stale
  const now = Date.now()
  const staleThresholdMs = CACHE_STALE_HOURS * 60 * 60 * 1000
  for (const row of rows ?? []) {
    const cachedAt = row.cached_at
    if (cachedAt) {
      const cachedMs = new Date(cachedAt).getTime()
      if (now - cachedMs > staleThresholdMs) {
        console.warn(
          `HubSpot schema for org ${orgId} is stale (cached at ${cachedAt}). Consider triggering a refresh.`
        )
        break
      }
    }
  }

  return schemas
}
