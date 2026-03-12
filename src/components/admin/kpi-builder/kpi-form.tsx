'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { BarChart3, PartyPopper, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PropertySelector } from '@/components/admin/shared/property-selector'
import { ConditionBuilder } from '@/components/admin/shared/condition-builder'
import { useIntegrationSchema } from '@/lib/hooks/useIntegrationSchema'
import type { PropertyForDropdown } from '@/lib/hooks/useIntegrationSchema'
import type { Condition } from '@/components/admin/shared/condition-row'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function slugifyToName(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'kpi'
}

const FORMATS = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
] as const

const CURRENCIES = [
  { value: 'CAD', label: 'CAD' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
] as const

const OBJECT_TYPES = [
  { value: 'deals', label: 'Deals' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'companies', label: 'Companies' },
] as const

const AGGREGATIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'avg', label: 'Average' },
] as const

const DATE_RANGES = [
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_year', label: 'This Year' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'all_time', label: 'All Time' },
  { value: 'custom', label: 'Custom' },
] as const

const TREND_COMPARE = [
  { value: 'previous_period', label: 'Previous Period' },
  { value: 'same_period_last_year', label: 'Same Period Last Year' },
] as const

const REFRESH_INTERVALS = [
  { value: 60, label: 'Every 1 min' },
  { value: 300, label: 'Every 5 min' },
  { value: 900, label: 'Every 15 min' },
  { value: 1800, label: 'Every 30 min' },
  { value: 3600, label: 'Every 1 hour' },
] as const

export type SourceType = 'integration' | 'celebration_aggregate' | 'manual'

export interface QueryConfigIntegration {
  object_type: string
  aggregation: string
  aggregate_field?: string
  filters: Array<{
    field: string
    operator: string
    value: unknown
    property_type: string
  }>
  date_range: {
    type: string
    date_field?: string
    from?: string
    to?: string
  }
}

export interface QueryConfigCelebration {
  template_ids: string[]
  aggregate: 'sum' | 'count'
  field?: string
  date_range: {
    type: string
    from?: string
    to?: string
  }
}

export interface KpiFormData {
  label: string
  name: string
  format: string
  currency: string
  source_type: SourceType
  integration_id: string | null
  query_config: QueryConfigIntegration | QueryConfigCelebration | Record<string, never>
  manual_value: number | ''
  show_trend: boolean
  trend_period: string
  refresh_seconds: number
  sort_order: number
  is_active: boolean
}

const DEFAULT_QUERY_CONFIG_INTEGRATION: QueryConfigIntegration = {
  object_type: 'deals',
  aggregation: 'sum',
  aggregate_field: undefined,
  filters: [],
  date_range: { type: 'this_quarter', date_field: 'closedate' },
}

const DEFAULT_QUERY_CONFIG_CELEBRATION: QueryConfigCelebration = {
  template_ids: [],
  aggregate: 'sum',
  field: undefined,
  date_range: { type: 'this_quarter' },
}

type Integration = { id: string; name: string; type: string }
type Template = { id: string; name: string }
type TriggerWithMapping = { template_id: string; field_mapping: Record<string, string> }

export interface KpiFormProps {
  kpiId?: string
  initialData?: Partial<KpiFormData> & {
    cached_value?: unknown
    cached_at?: string | null
  }
  onSuccess?: () => void
}

export function KpiForm({ kpiId, initialData, onSuccess }: KpiFormProps) {
  const router = useRouter()
  const { orgId } = useOrg()

  const [label, setLabel] = React.useState(initialData?.label ?? '')
  const [name, setName] = React.useState(initialData?.name ?? '')
  const [nameEditable, setNameEditable] = React.useState(false)
  const [format, setFormat] = React.useState(initialData?.format ?? 'number')
  const [currency, setCurrency] = React.useState(initialData?.currency ?? 'CAD')
  const [sourceType, setSourceType] = React.useState<SourceType>(
    (initialData?.source_type as SourceType) ?? 'integration'
  )
  const [integrationId, setIntegrationId] = React.useState(initialData?.integration_id ?? '')
  const [objectType, setObjectType] = React.useState(
    (initialData?.query_config as QueryConfigIntegration)?.object_type ?? 'deals'
  )
  const [aggregation, setAggregation] = React.useState(
    (initialData?.query_config as QueryConfigIntegration)?.aggregation ?? 'sum'
  )
  const [aggregateField, setAggregateField] = React.useState<PropertyForDropdown | null>(null)
  const [conditions, setConditions] = React.useState<Condition[]>([])
  const [dateRangeType, setDateRangeType] = React.useState(
    (initialData?.query_config as QueryConfigIntegration)?.date_range?.type ?? 'this_quarter'
  )
  const [dateField, setDateField] = React.useState<PropertyForDropdown | null>(null)
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')
  const [templateIds, setTemplateIds] = React.useState<string[]>(
    (initialData?.query_config as QueryConfigCelebration)?.template_ids ?? []
  )
  const [celebrationAggregate, setCelebrationAggregate] = React.useState<'sum' | 'count'>(
    (initialData?.query_config as QueryConfigCelebration)?.aggregate ?? 'sum'
  )
  const [celebrationField, setCelebrationField] = React.useState(
    (initialData?.query_config as QueryConfigCelebration)?.field ?? ''
  )
  const [celebrationDateRange, setCelebrationDateRange] = React.useState(
    (initialData?.query_config as QueryConfigCelebration)?.date_range?.type ?? 'this_quarter'
  )
  const [manualValue, setManualValue] = React.useState<number | ''>(
    initialData?.manual_value ?? ''
  )
  const [manualUpdatedAt, setManualUpdatedAt] = React.useState<string | null>(
    initialData?.cached_at ?? null
  )
  const [showTrend, setShowTrend] = React.useState(initialData?.show_trend ?? true)
  const [trendPeriod, setTrendPeriod] = React.useState(
    initialData?.trend_period ?? 'previous_period'
  )
  const [refreshSeconds, setRefreshSeconds] = React.useState(
    initialData?.refresh_seconds ?? 300
  )
  const [sortOrder, setSortOrder] = React.useState(initialData?.sort_order ?? 0)
  const [saving, setSaving] = React.useState(false)
  const [previewValue, setPreviewValue] = React.useState<number | null>(null)

  const [integrations, setIntegrations] = React.useState<Integration[]>([])
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [celebrationFields, setCelebrationFields] = React.useState<string[]>([])

  const { properties } = useIntegrationSchema({
    integrationId: integrationId || null,
    objectType: objectType as 'deals' | 'contacts' | 'companies',
  })

  const numberProperties = React.useMemo(
    () => properties.filter((p) => p.type === 'number'),
    [properties]
  )
  const dateProperties = React.useMemo(
    () => properties.filter((p) => p.type === 'date' || p.type === 'datetime'),
    [properties]
  )

  React.useEffect(() => {
    if (!orgId) return
    const supabase = createClient()
    supabase
      .from('integrations')
      .select('id, name, type')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .then(({ data }) => setIntegrations((data as Integration[]) ?? []))
    supabase
      .from('celebration_templates')
      .select('id, name')
      .eq('org_id', orgId)
      .then(({ data }) => setTemplates((data as Template[]) ?? []))
  }, [orgId])

  React.useEffect(() => {
    if (templateIds.length === 0) {
      setCelebrationFields([])
      return
    }
    const supabase = createClient()
    supabase
      .from('celebration_triggers')
      .select('template_id, field_mapping')
      .in('template_id', templateIds)
      .then(({ data }) => {
        const fields = new Set<string>()
        for (const t of (data as TriggerWithMapping[]) ?? []) {
          const mapping = t.field_mapping ?? {}
          for (const key of Object.keys(mapping)) {
            if (key && key !== 'id') fields.add(key)
          }
        }
        setCelebrationFields(Array.from(fields).sort())
      })
  }, [templateIds])

  React.useEffect(() => {
    if (!nameEditable && label) {
      setName(slugifyToName(label))
    }
  }, [label, nameEditable])

  React.useEffect(() => {
    const qc = initialData?.query_config as QueryConfigIntegration | undefined
    if (!qc || sourceType !== 'integration') return
    const af = qc.aggregate_field
    if (af && numberProperties.length > 0) {
      const found = numberProperties.find((p) => p.name === af)
      if (found) setAggregateField(found)
    }
    const df = qc.date_range?.date_field
    if (df && dateProperties.length > 0) {
      const found = dateProperties.find((p) => p.name === df)
      if (found) setDateField(found)
    }
    const filters = qc.filters ?? []
    if (filters.length > 0) {
      setConditions(
        filters.map((f) => ({
          field: f.field,
          operator: f.operator,
          value: f.value,
          property_type: f.property_type as Condition['property_type'],
          property_label: undefined,
        }))
      )
    }
  }, [initialData?.query_config, sourceType, numberProperties, dateProperties])

  const buildQueryConfig = (): QueryConfigIntegration | QueryConfigCelebration | Record<string, never> => {
    if (sourceType === 'integration') {
      const filters = conditions
        .filter((c) => c.field && c.operator)
        .map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
          property_type: c.property_type,
        }))
      return {
        object_type: objectType,
        aggregation,
        aggregate_field: aggregation === 'sum' || aggregation === 'avg' ? aggregateField?.name : undefined,
        filters,
        date_range: {
          type: dateRangeType,
          date_field: dateField?.name ?? (objectType === 'deals' ? 'closedate' : 'createdate'),
          ...(dateRangeType === 'custom' && { from: dateFrom, to: dateTo }),
        },
      }
    }
    if (sourceType === 'celebration_aggregate') {
      return {
        template_ids: templateIds,
        aggregate: celebrationAggregate,
        field: celebrationAggregate === 'sum' ? celebrationField || undefined : undefined,
        date_range: {
          type: celebrationDateRange,
          ...(celebrationDateRange === 'custom' && { from: dateFrom, to: dateTo }),
        },
      }
    }
    return {}
  }

  const formatPreviewValue = (val: number | null): string => {
    if (val == null) return '—'
    if (format === 'currency') {
      const sym = { CAD: '$', USD: '$', EUR: '€', GBP: '£' }[currency] ?? '$'
      return `${sym}${val.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`
    }
    if (format === 'percentage') return `${val.toLocaleString()}%`
    return val.toLocaleString()
  }

  const handleSave = async (activate: boolean) => {
    if (!orgId) return
    if (!label.trim()) {
      toast.error('Label is required')
      return
    }
    const finalName = nameEditable ? name : slugifyToName(label)
    if (!finalName.trim()) {
      toast.error('Internal name is required')
      return
    }
    if (sourceType === 'integration') {
      if (!integrationId) {
        toast.error('Select an integration')
        return
      }
      if ((aggregation === 'sum' || aggregation === 'avg') && !aggregateField) {
        toast.error('Select an aggregate field')
        return
      }
    }
    if (sourceType === 'celebration_aggregate') {
      if (templateIds.length === 0) {
        toast.error('Select at least one celebration template')
        return
      }
      if (celebrationAggregate === 'sum' && !celebrationField) {
        toast.error('Select a field to sum')
        return
      }
    }
    if (sourceType === 'manual' && manualValue === '') {
      toast.error('Enter a value')
      return
    }

    setSaving(true)
    try {
      const queryConfig = buildQueryConfig()
      let cachedValue: unknown = null
      if (sourceType === 'manual') {
        const num = typeof manualValue === 'number' ? manualValue : parseFloat(String(manualValue))
        cachedValue = isNaN(num) ? { value: 0 } : { value: num }
      }

      const payload = {
        name: finalName.trim(),
        label: label.trim(),
        source_type: sourceType,
        integration_id: sourceType === 'integration' ? integrationId : null,
        query_config: queryConfig,
        format,
        currency,
        show_trend: showTrend,
        trend_period: trendPeriod,
        refresh_seconds: refreshSeconds,
        sort_order: sortOrder,
        is_active: activate,
        ...(sourceType === 'manual' && cachedValue
          ? { cached_value: cachedValue, cached_at: new Date().toISOString() }
          : {}),
      }

      if (kpiId) {
        const res = await fetch(`/api/kpis/${kpiId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error ?? 'Failed to update')
        toast.success('KPI updated')
      } else {
        const res = await fetch('/api/kpis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error ?? 'Failed to create')
        toast.success('KPI created')
      }

      onSuccess?.()
      router.push('/app/kpis')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save KPI')
    } finally {
      setSaving(false)
    }
  }

  const displayValue =
    sourceType === 'manual'
      ? typeof manualValue === 'number'
        ? manualValue
        : parseFloat(String(manualValue)) || null
      : previewValue ?? (initialData?.cached_value as { value?: number } | null)?.value ?? null

  if (!orgId) return null

  return (
    <div className="space-y-8">
      {/* Section A: KPI Identity */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium">KPI Identity</h3>
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              placeholder="Revenue This Quarter"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">What appears on the TV card</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Internal name</Label>
              <button
                type="button"
                onClick={() => setNameEditable(!nameEditable)}
                className="text-muted-foreground hover:text-foreground text-xs underline"
              >
                {nameEditable ? 'auto-generate' : 'edit'}
              </button>
            </div>
            <p className={cn('text-sm', nameEditable ? '' : 'text-muted-foreground')}>
              {nameEditable ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="revenue_this_quarter"
                  className="max-w-xs"
                />
              ) : (
                name || slugifyToName(label) || '—'
              )}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {format === 'currency' && (
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section B: Data Source */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium">Data Source</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setSourceType('integration')}
              className={cn(
                'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                sourceType === 'integration'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              )}
            >
              <BarChart3 className="size-6 text-muted-foreground" />
              <span className="font-medium">From Integration</span>
              <span className="text-muted-foreground text-xs">
                Query live data from HubSpot
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('celebration_aggregate')}
              className={cn(
                'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                sourceType === 'celebration_aggregate'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              )}
            >
              <PartyPopper className="size-6 text-muted-foreground" />
              <span className="font-medium">From Celebrations</span>
              <span className="text-muted-foreground text-xs">
                Aggregate from celebration history
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('manual')}
              className={cn(
                'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors',
                sourceType === 'manual'
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted/50'
              )}
            >
              <Pencil className="size-6 text-muted-foreground" />
              <span className="font-medium">Manual</span>
              <span className="text-muted-foreground text-xs">
                Enter a value manually
              </span>
            </button>
          </div>

          {sourceType === 'integration' && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Integration</Label>
                <Select value={integrationId} onValueChange={setIntegrationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select integration" />
                  </SelectTrigger>
                  <SelectContent>
                    {integrations.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name} ({i.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Object type</Label>
                <Select
                  value={objectType}
                  onValueChange={(v) => {
                    setObjectType(v)
                    setAggregateField(null)
                    setDateField(null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBJECT_TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aggregation</Label>
                <Select value={aggregation} onValueChange={setAggregation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGGREGATIONS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(aggregation === 'sum' || aggregation === 'avg') && (
                <div className="space-y-2">
                  <Label>Aggregate field</Label>
                  <PropertySelector
                    integrationId={integrationId || null}
                    objectType={objectType as 'deals' | 'contacts' | 'companies'}
                    value={aggregateField}
                    onSelect={setAggregateField}
                    placeholder="Select number property..."
                    propertyTypeFilter={['number']}
                  />
                  <p className="text-muted-foreground text-xs">
                    Only number-type properties are shown
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Filters</Label>
                <ConditionBuilder
                  conditions={conditions}
                  integrationId={integrationId || null}
                  objectType={objectType as 'deals' | 'contacts' | 'companies'}
                  onChange={setConditions}
                  emptyMessage="Add conditions to filter which records are included in the aggregation."
                />
              </div>
              <div className="space-y-2">
                <Label>Date range</Label>
                <Select value={dateRangeType} onValueChange={setDateRangeType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dateRangeType === 'custom' && (
                  <div className="flex gap-4 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs">From</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                {dateRangeType !== 'custom' && dateRangeType !== 'all_time' && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs">Date property</Label>
                    <PropertySelector
                      integrationId={integrationId || null}
                      objectType={objectType as 'deals' | 'contacts' | 'companies'}
                      value={dateField}
                      onSelect={setDateField}
                      placeholder={
                        objectType === 'deals'
                          ? 'closedate (default)'
                          : 'Select date property...'
                      }
                      propertyTypeFilter={['date', 'datetime']}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {sourceType === 'celebration_aggregate' && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Templates</Label>
                <p className="text-muted-foreground text-xs">
                  Select celebration templates to aggregate from
                </p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <Button
                      key={t.id}
                      type="button"
                      variant={templateIds.includes(t.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setTemplateIds((prev) =>
                          prev.includes(t.id)
                            ? prev.filter((id) => id !== t.id)
                            : [...prev, t.id]
                        )
                      }
                    >
                      {t.name}
                    </Button>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-muted-foreground text-sm">
                      No templates yet. Create celebration templates first.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Aggregation</Label>
                <Select
                  value={celebrationAggregate}
                  onValueChange={(v) => setCelebrationAggregate(v as 'sum' | 'count')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {celebrationAggregate === 'sum' && (
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Select
                    value={celebrationField}
                    onValueChange={setCelebrationField}
                    disabled={celebrationFields.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent>
                      {celebrationFields.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Display fields from selected templates&apos; field mapping
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Time period</Label>
                <Select value={celebrationDateRange} onValueChange={setCelebrationDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_RANGES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {sourceType === 'manual' && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={manualValue === '' ? '' : manualValue}
                  onChange={(e) => {
                    const v = e.target.value
                    setManualValue(v === '' ? '' : parseFloat(v) || 0)
                    setManualUpdatedAt(new Date().toISOString())
                  }}
                />
                <p className="text-muted-foreground text-xs">
                  Update this value manually anytime. Last updated:{' '}
                  {manualUpdatedAt
                    ? new Date(manualUpdatedAt).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section C: Display Options */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium">Display Options</h3>
          <div className="flex items-center justify-between">
            <Label>Show trend</Label>
            <Switch checked={showTrend} onCheckedChange={setShowTrend} />
          </div>
          {showTrend && (
            <div className="space-y-2">
              <Label>Compare to</Label>
              <Select value={trendPeriod} onValueChange={setTrendPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TREND_COMPARE.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Refresh interval</Label>
            <Select
              value={String(refreshSeconds)}
              onValueChange={(v) => setRefreshSeconds(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_INTERVALS.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sort order / position</Label>
            <Input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              className="w-24"
            />
            <p className="text-muted-foreground text-xs">
              Determines display order on the TV dashboard (1, 2, 3...)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section D: Preview */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-medium">Preview</h3>
          <div className="rounded-lg bg-zinc-900 p-6 text-zinc-100">
            <p className="mb-2 text-lg font-medium text-zinc-300">{label || 'KPI Label'}</p>
            <p className="text-4xl font-bold tabular-nums">
              {formatPreviewValue(displayValue)}
            </p>
            {showTrend && (
              <p className="mt-2 text-sm text-zinc-400">
                ↑ +12% vs previous period
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section E: Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => handleSave(true)}
          disabled={saving}
        >
          Save & Activate
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={saving}
        >
          Save as Draft
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push('/app/kpis')}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
