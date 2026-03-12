'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

// -----------------------------------------------------------------------------
// Types (from CELEBRATION-BUILDER-REDESIGN-SPEC Part 1)
// -----------------------------------------------------------------------------

export type PropertyType =
  | 'string'
  | 'number'
  | 'date'
  | 'datetime'
  | 'enumeration'
  | 'bool'

export interface PropertyForDropdown {
  name: string
  label: string
  type: PropertyType
  fieldType: string
  group: string
  groupLabel: string
  description?: string
  options?: { label: string; value: string }[]
}

export interface PipelineForDropdown {
  id: string
  label: string
  stages: {
    id: string
    label: string
    displayOrder: number
  }[]
}

export interface OwnerForDropdown {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
}

// -----------------------------------------------------------------------------
// Transform helpers
// -----------------------------------------------------------------------------

function toGroupLabel(groupName: string): string {
  if (!groupName) return 'Other'
  return groupName
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function toPropertyType(raw: string): PropertyType {
  const t = (raw ?? '').toLowerCase()
  if (['string', 'number', 'date', 'datetime', 'enumeration', 'bool'].includes(t)) {
    return t as PropertyType
  }
  if (t === 'bool' || t === 'boolean') return 'bool'
  return 'string'
}

function transformProperties(raw: unknown): PropertyForDropdown[] {
  const data = raw as { results?: Array<Record<string, unknown>> }
  const results = data?.results ?? []
  return results.map((p) => {
    const name = String(p.name ?? '')
    const label = String(p.label ?? name)
    const type = toPropertyType(String(p.type ?? 'string'))
    const fieldType = String(p.fieldType ?? 'text')
    const groupName = String(p.groupName ?? 'other')
    const groupLabel = toGroupLabel(groupName)
    const options = Array.isArray(p.options)
      ? (p.options as Array<{ label?: string; value?: string }>)
          .filter((o) => o?.value != null)
          .map((o) => ({
            label: String(o.label ?? o.value ?? ''),
            value: String(o.value ?? ''),
          }))
      : undefined
    return {
      name,
      label,
      type,
      fieldType,
      group: groupName,
      groupLabel,
      description: p.description ? String(p.description) : undefined,
      options,
    }
  })
}

function transformPipelines(raw: unknown): PipelineForDropdown[] {
  const data = raw as { results?: Array<Record<string, unknown>> }
  const results = data?.results ?? []
  return results.map((p) => ({
    id: String(p.id ?? ''),
    label: String(p.label ?? ''),
    stages: (Array.isArray(p.stages) ? p.stages : []).map(
      (s: Record<string, unknown>) => ({
        id: String(s.id ?? ''),
        label: String(s.label ?? ''),
        displayOrder: Number(s.displayOrder ?? 0),
      })
    ),
  }))
}

function transformOwners(raw: unknown): OwnerForDropdown[] {
  const data = raw as { results?: Array<Record<string, unknown>> }
  const results = data?.results ?? []
  return results
    .filter((o) => !o.archived)
    .map((o) => {
      const firstName = String(o.firstName ?? '')
      const lastName = String(o.lastName ?? '')
      return {
        id: String(o.id ?? ''),
        email: String(o.email ?? ''),
        firstName,
        lastName,
        fullName: [firstName, lastName].filter(Boolean).join(' ') || String(o.email ?? ''),
      }
    })
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

type ObjectType = 'deals' | 'contacts' | 'companies'

interface UseIntegrationSchemaOptions {
  integrationId: string | null
  objectType?: ObjectType
}

interface SchemaState {
  properties: PropertyForDropdown[]
  pipelines: PipelineForDropdown[]
  owners: OwnerForDropdown[]
  isLoading: boolean
  error: Error | null
  refresh: () => void
}

export function useIntegrationSchema({
  integrationId,
  objectType = 'deals',
}: UseIntegrationSchemaOptions): SchemaState {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['integration-schema', integrationId],
    queryFn: async () => {
      if (!integrationId) return null
      const res = await fetch(`/api/integrations/${integrationId}/schema`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `Schema fetch failed: ${res.status}`)
      }
      const json = (await res.json()) as { schemas?: Array<{ schema_type: string; object_type: string | null; data: unknown }> }
      return json.schemas ?? []
    },
    enabled: !!integrationId,
    staleTime: 1000 * 60 * 5, // 5 min
  })

  const schemas = data ?? []
  const propertiesSchema = schemas.find(
    (s) => s.schema_type === 'properties' && (s.object_type ?? '') === objectType
  )
  const pipelinesSchema = schemas.find(
    (s) => s.schema_type === 'pipelines' && (s.object_type ?? '') === ''
  )
  const ownersSchema = schemas.find(
    (s) => s.schema_type === 'owners' && (s.object_type ?? '') === ''
  )

  const properties = propertiesSchema ? transformProperties(propertiesSchema.data) : []
  const pipelines = pipelinesSchema ? transformPipelines(pipelinesSchema.data) : []
  const owners = ownersSchema ? transformOwners(ownersSchema.data) : []

  const refresh = () => {
    if (integrationId) {
      queryClient.invalidateQueries({ queryKey: ['integration-schema', integrationId] })
      refetch()
    }
  }

  return {
    properties,
    pipelines,
    owners,
    isLoading,
    error: error as Error | null,
    refresh,
  }
}
