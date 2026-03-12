'use client'

import * as React from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PropertySelector } from './property-selector'
import { useIntegrationSchema } from '@/lib/hooks/useIntegrationSchema'
import type {
  PropertyForDropdown,
  PropertyType,
} from '@/lib/hooks/useIntegrationSchema'

// -----------------------------------------------------------------------------
// Operator definitions by property type
// -----------------------------------------------------------------------------

const STRING_OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'does not contain' },
  { value: 'is_known', label: 'is known' },
  { value: 'is_unknown', label: 'is unknown' },
] as const

const NUMBER_OPERATORS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'does not equal' },
  { value: 'gt', label: 'greater than' },
  { value: 'lt', label: 'less than' },
  { value: 'gte', label: 'greater than or equal' },
  { value: 'lte', label: 'less than or equal' },
  { value: 'between', label: 'between' },
  { value: 'is_known', label: 'is known' },
  { value: 'is_unknown', label: 'is unknown' },
] as const

const DATE_OPERATORS = [
  { value: 'eq', label: 'equals' },
  { value: 'before', label: 'is before' },
  { value: 'after', label: 'is after' },
  { value: 'between', label: 'is between' },
  { value: 'within_last', label: 'within last' },
  { value: 'is_known', label: 'is known' },
  { value: 'is_unknown', label: 'is unknown' },
] as const

const ENUM_OPERATORS = [
  { value: 'is_any_of', label: 'is any of' },
  { value: 'is_none_of', label: 'is none of' },
  { value: 'is_known', label: 'is known' },
  { value: 'is_unknown', label: 'is unknown' },
] as const

const BOOL_OPERATORS = [
  { value: 'is_true', label: 'is true' },
  { value: 'is_false', label: 'is false' },
] as const

const NO_VALUE_OPERATORS = new Set([
  'is_known',
  'is_unknown',
  'is_true',
  'is_false',
])

const WITHIN_LAST_UNITS = [
  { value: 'days', label: 'days' },
  { value: 'weeks', label: 'weeks' },
  { value: 'months', label: 'months' },
] as const

function getOperatorsForType(type: PropertyType) {
  switch (type) {
    case 'string':
      return STRING_OPERATORS
    case 'number':
      return NUMBER_OPERATORS
    case 'date':
    case 'datetime':
      return DATE_OPERATORS
    case 'enumeration':
      return ENUM_OPERATORS
    case 'bool':
      return BOOL_OPERATORS
    default:
      return STRING_OPERATORS
  }
}

// -----------------------------------------------------------------------------
// Condition type
// -----------------------------------------------------------------------------

export interface Condition {
  field: string
  operator: string
  value: unknown
  property_type: PropertyType
  property_label?: string
}

export interface ConditionRowProps {
  condition: Condition
  integrationId: string | null
  objectType: 'deals' | 'contacts' | 'companies'
  onChange: (condition: Condition) => void
  onRemove: () => void
}

export function ConditionRow({
  condition,
  integrationId,
  objectType,
  onChange,
  onRemove,
}: ConditionRowProps) {
  const { properties } = useIntegrationSchema({ integrationId, objectType })
  const selectedProperty = properties.find((p) => p.name === condition.field)
  const operators = getOperatorsForType(condition.property_type)
  const needsNoValue = NO_VALUE_OPERATORS.has(condition.operator)

  const handlePropertySelect = (prop: PropertyForDropdown) => {
    const defaultOp = getOperatorsForType(prop.type)[0]
    onChange({
      field: prop.name,
      operator: defaultOp.value,
      value: prop.type === 'enumeration' ? [] : '',
      property_type: prop.type,
      property_label: prop.label,
    })
  }

  const handleOperatorChange = (op: string) => {
    const needsNoVal = NO_VALUE_OPERATORS.has(op)
    onChange({
      ...condition,
      operator: op,
      value: needsNoVal ? undefined : condition.value,
    })
  }

  const handleValueChange = (val: unknown) => {
    onChange({ ...condition, value: val })
  }

  const handleEnumToggle = (optValue: string) => {
    const current = Array.isArray(condition.value) ? condition.value : []
    const next = current.includes(optValue)
      ? current.filter((v) => v !== optValue)
      : [...current, optValue]
    handleValueChange(next)
  }

  const renderValueInput = () => {
    if (needsNoValue) return null

    const type = condition.property_type
    const op = condition.operator

    if (type === 'enumeration' && (op === 'is_any_of' || op === 'is_none_of')) {
      const options = selectedProperty?.options ?? []
      return (
        <div className="flex min-w-[200px] flex-wrap gap-1.5 rounded-md border border-input bg-background p-2">
          {options.length === 0 ? (
            <span className="text-muted-foreground text-sm">
              No options
            </span>
          ) : (
            options.map((opt) => {
              const selected = Array.isArray(condition.value) && condition.value.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleEnumToggle(opt.value)}
                  className={cn(
                    'rounded-md border px-2 py-1 text-xs transition-colors',
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-transparent bg-muted hover:bg-muted/80'
                  )}
                >
                  {opt.label}
                </button>
              )
            })
          )}
        </div>
      )
    }

    if (type === 'number' && op === 'between') {
      const arr = Array.isArray(condition.value) ? condition.value : ['', '']
      const a = arr[0] ?? ''
      const b = arr[1] ?? ''
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={a}
            onChange={(e) => handleValueChange([e.target.value, b])}
            className="w-24"
          />
          <span className="text-muted-foreground text-sm">and</span>
          <Input
            type="number"
            placeholder="Max"
            value={b}
            onChange={(e) => handleValueChange([a, e.target.value])}
            className="w-24"
          />
        </div>
      )
    }

    if (type === 'number') {
      return (
        <Input
          type="number"
          placeholder="Value"
          value={condition.value as string | number}
          onChange={(e) =>
            handleValueChange(e.target.value === '' ? '' : Number(e.target.value))
          }
          className="w-32"
        />
      )
    }

    if ((type === 'date' || type === 'datetime') && op === 'between') {
      const arr = Array.isArray(condition.value) ? condition.value : ['', '']
      const a = arr[0] ?? ''
      const b = arr[1] ?? ''
      return (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={a}
            onChange={(e) => handleValueChange([e.target.value, b])}
            className="w-36"
          />
          <span className="text-muted-foreground text-sm">and</span>
          <Input
            type="date"
            value={b}
            onChange={(e) => handleValueChange([a, e.target.value])}
            className="w-36"
          />
        </div>
      )
    }

    if ((type === 'date' || type === 'datetime') && op === 'within_last') {
      const val = condition.value as { value?: number; unit?: string } | undefined
      const num = val?.value ?? ''
      const unit = val?.unit ?? 'days'
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            placeholder="N"
            value={num}
            onChange={(e) =>
              handleValueChange({
                value: e.target.value === '' ? undefined : Number(e.target.value),
                unit,
              })
            }
            className="w-20"
          />
          <Select
            value={unit}
            onValueChange={(u) =>
              handleValueChange({
                value: typeof num === 'number' ? num : (num ? Number(num) : undefined),
                unit: u,
              })
            }
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WITHIN_LAST_UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (type === 'date' || type === 'datetime') {
      return (
        <Input
          type={type === 'datetime' ? 'datetime-local' : 'date'}
          value={condition.value as string}
          onChange={(e) => handleValueChange(e.target.value)}
          className="w-36"
        />
      )
    }

    return (
      <Input
        type="text"
        placeholder="Value"
        value={condition.value as string}
        onChange={(e) => handleValueChange(e.target.value)}
        className="min-w-[160px]"
      />
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-[200px]">
        <PropertySelector
          integrationId={integrationId}
          objectType={objectType}
          value={selectedProperty ?? null}
          onSelect={handlePropertySelect}
          placeholder="Select property"
        />
      </div>
      <Select
        value={condition.operator}
        onValueChange={handleOperatorChange}
        disabled={!selectedProperty}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {renderValueInput()}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive"
        aria-label="Remove condition"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}
