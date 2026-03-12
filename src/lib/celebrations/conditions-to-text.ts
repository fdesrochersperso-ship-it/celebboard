/**
 * Converts celebration trigger conditions (jsonb) to human-readable plain English.
 * Used on list cards and Step 3 summary.
 */

const OPERATOR_LABELS: Record<string, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  not_contains: 'does not contain',
  eq: 'equals',
  neq: 'does not equal',
  gt: 'greater than',
  lt: 'less than',
  gte: 'greater than or equal',
  lte: 'less than or equal',
  is_any_of: 'is any of',
  is_none_of: 'is none of',
  is_known: 'is known',
  is_unknown: 'is unknown',
  is_true: 'is true',
  is_false: 'is false',
  before: 'is before',
  after: 'is after',
  between: 'is between',
  within_last: 'within last',
}

export interface ConditionInput {
  field: string
  operator?: string
  op?: string
  value?: unknown
  property_label?: string
}

function formatConditionValue(
  c: { operator?: string; op?: string; value?: unknown; property_label?: string }
): string {
  const op = c.operator ?? c.op ?? ''
  if (['is_known', 'is_unknown', 'is_true', 'is_false'].includes(op)) {
    return OPERATOR_LABELS[op] ?? op
  }
  const val = c.value
  if (op === 'within_last' && val && typeof val === 'object' && 'value' in val && 'unit' in val) {
    const v = val as { value: number; unit: string }
    return `${v.value} ${v.unit}`
  }
  if (Array.isArray(val)) {
    return val.join(', ')
  }
  if (typeof val === 'number') {
    return val >= 1000 ? `$${val.toLocaleString()}` : String(val)
  }
  return String(val ?? '')
}

function formatCondition(c: ConditionInput): string {
  const label = c.property_label ?? c.field
  const op = c.operator ?? c.op ?? 'equals'
  const opLabel = OPERATOR_LABELS[op] ?? op
  const valStr = formatConditionValue(c)
  return `${label} ${opLabel} ${valStr}`.trim()
}

/**
 * Converts an array of conditions to a human-readable string joined with " AND ".
 * @param conditions - Array of condition objects from trigger.conditions jsonb
 * @param _properties - Optional schema properties (for future enum label resolution)
 */
export function conditionsToText(
  conditions: ConditionInput[],
  _properties?: Record<string, { label?: string }>
): string {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return 'No conditions'
  }
  const valid = conditions.filter((c) => c.field && (c.operator ?? c.op))
  if (valid.length === 0) return 'No conditions'
  return valid.map(formatCondition).join(' AND ')
}
