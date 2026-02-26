import type { SupabaseClient } from '@supabase/supabase-js'

type Condition = {
  field: string
  op: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains'
  value: unknown
}

function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

export function evaluateConditions(
  conditions: Condition[],
  payload: Record<string, unknown>
): boolean {
  if (!Array.isArray(conditions) || conditions.length === 0) return true

  for (const cond of conditions) {
    const actual = getValueByPath(payload, cond.field)
    const expected = cond.value

    const actualStr = String(actual ?? '')
    const expectedStr = String(expected ?? '')

    switch (cond.op) {
      case 'eq':
        if (actual !== expected) return false
        break
      case 'neq':
        if (actual === expected) return false
        break
      case 'gt': {
        const a = Number(actual)
        const b = Number(expected)
        if (isNaN(a) || isNaN(b) || a <= b) return false
        break
      }
      case 'lt': {
        const a = Number(actual)
        const b = Number(expected)
        if (isNaN(a) || isNaN(b) || a >= b) return false
        break
      }
      case 'gte': {
        const a = Number(actual)
        const b = Number(expected)
        if (isNaN(a) || isNaN(b) || a < b) return false
        break
      }
      case 'lte': {
        const a = Number(actual)
        const b = Number(expected)
        if (isNaN(a) || isNaN(b) || a > b) return false
        break
      }
      case 'contains':
        if (!actualStr.toLowerCase().includes(expectedStr.toLowerCase())) return false
        break
      case 'not_contains':
        if (actualStr.toLowerCase().includes(expectedStr.toLowerCase())) return false
        break
      default:
        return false
    }
  }
  return true
}

export function applyFieldMapping(
  mapping: Record<string, string>,
  payload: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [displayField, sourcePath] of Object.entries(mapping)) {
    const value = getValueByPath(payload, sourcePath)
    if (value !== undefined) {
      result[displayField] = value
    }
  }
  return result
}

export function renderTemplate(
  pattern: string,
  data: Record<string, unknown>
): string {
  return pattern.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key]
    return value != null ? String(value) : ''
  })
}

export async function resolveTeamMembers(
  externalIds: Record<string, string>,
  orgId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  const ids = Object.entries(externalIds).filter(([, v]) => v != null && v !== '')
  if (ids.length === 0) return []

  const memberIds: string[] = []

  for (const [key, value] of ids) {
    const { data } = await supabase
      .from('team_members')
      .select('id')
      .eq('org_id', orgId)
      .contains('external_ids', { [key]: value })
      .limit(1)

    if (data?.[0]?.id) {
      memberIds.push(data[0].id)
    }
  }

  return [...new Set(memberIds)]
}
