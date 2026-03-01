'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-clients'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'

const SOURCE_TYPES = [
  { value: 'integration', label: 'Integration' },
  { value: 'celebration_aggregate', label: 'Celebration Aggregate' },
  { value: 'manual', label: 'Manual' },
] as const

const FORMATS = [
  { value: 'number', label: 'Number' },
  { value: 'currency', label: 'Currency' },
  { value: 'percentage', label: 'Percentage' },
] as const

const CURRENCIES = [
  { value: 'CAD', label: 'CAD' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
] as const

const TREND_PERIODS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
] as const

const AGGREGATES = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'avg', label: 'Average' },
] as const

type KpiRow = {
  id: string
  name: string
  label: string
  source_type: string
  integration_id: string | null
  query_config: Record<string, unknown>
  format: string
  currency: string
  show_trend: boolean
  trend_period: string
  sort_order: number
  is_active: boolean
  cached_value: unknown
  refresh_seconds: number
}

type Integration = { id: string; name: string; type: string }
type Template = { id: string; name: string }
type TeamMember = { id: string; name: string }
type LeaderOverride = { team_member_id: string; value: number }

type PresetInput = {
  name: string
  label: string
  source_type: 'integration' | 'celebration_aggregate' | 'manual'
  query_config?: Record<string, unknown>
  format: string
  currency: string
  show_trend: boolean
  trend_period: string
  refresh_seconds: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  onSuccess: () => void
  kpi?: KpiRow | null
  preset?: PresetInput | null
}

type QueryConfigRow = { key: string; value: string }

export function KpiDialog({ open, onOpenChange, orgId, onSuccess, kpi, preset }: Props) {
  const isEdit = !!kpi

  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [name, setName] = useState('')
  const [label, setLabel] = useState('')
  const [sourceType, setSourceType] = useState<string>('integration')
  const [integrationId, setIntegrationId] = useState('')
  const [queryConfigRows, setQueryConfigRows] = useState<QueryConfigRow[]>([{ key: '', value: '' }])
  const [templateIds, setTemplateIds] = useState<string[]>([])
  const [aggregateField, setAggregateField] = useState('amount')
  const [aggregateOp, setAggregateOp] = useState('sum')
  const [aggregatePeriod, setAggregatePeriod] = useState('quarter')
  const [manualValue, setManualValue] = useState('')
  const [format, setFormat] = useState('number')
  const [currency, setCurrency] = useState('CAD')
  const [showTrend, setShowTrend] = useState(true)
  const [trendPeriod, setTrendPeriod] = useState('quarter')
  const [sortOrder, setSortOrder] = useState(0)
  const [refreshSeconds, setRefreshSeconds] = useState(300)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [goal, setGoal] = useState<number | ''>('')
  const [leaderOverrides, setLeaderOverrides] = useState<LeaderOverride[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && orgId) {
      const supabase = createClient()
      supabase
        .from('integrations')
        .select('id, name, type')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .then(({ data }) => setIntegrations((data as unknown as Integration[]) ?? []))
      supabase
        .from('celebration_templates')
        .select('id, name')
        .eq('org_id', orgId)
        .then(({ data }) => setTemplates((data as unknown as Template[]) ?? []))
      supabase
        .from('team_members')
        .select('id, name')
        .eq('org_id', orgId)
        .order('name')
        .then(({ data }) => setTeamMembers((data as unknown as TeamMember[]) ?? []))
    }
  }, [open, orgId])

  useEffect(() => {
    if (open) {
      if (kpi) {
        setName(kpi.name)
        setLabel(kpi.label)
        setSourceType(kpi.source_type)
        setIntegrationId(kpi.integration_id ?? '')
        const qc = (kpi.query_config ?? {}) as Record<string, unknown>
        if (kpi.source_type === 'integration' && qc && Object.keys(qc).length > 0) {
          setQueryConfigRows(
            Object.entries(qc).map(([k, v]) => ({
              key: k,
              value: typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''),
            }))
          )
        } else {
          setQueryConfigRows([{ key: '', value: '' }])
        }
        const tids = (qc.template_ids as string[]) ?? []
        setTemplateIds(tids)
        setAggregateField(String(qc?.field ?? 'amount'))
        setAggregateOp(String(qc?.aggregate ?? 'sum'))
        setAggregatePeriod(String(qc?.period ?? 'quarter'))
        setManualValue(String((kpi.cached_value as { value?: number })?.value ?? kpi.cached_value ?? ''))
        setShowLeaderboard(Boolean((qc.show_leaderboard as boolean) ?? false))
        setGoal((qc.goal as number) ?? '')
        setLeaderOverrides((qc.leader_overrides as LeaderOverride[]) ?? [])
        setFormat(kpi.format)
        setCurrency(kpi.currency)
        setShowTrend(kpi.show_trend)
        setTrendPeriod(kpi.trend_period)
        setSortOrder(kpi.sort_order)
        setRefreshSeconds(kpi.refresh_seconds)
      } else if (preset) {
        setName(preset.name)
        setLabel(preset.label)
        setSourceType(preset.source_type)
        setIntegrationId('')
        const qc = preset.query_config ?? {}
        setQueryConfigRows(
          Object.entries(qc).length > 0
            ? Object.entries(qc).map(([k, v]) => ({
                key: k,
                value: typeof v === 'object' ? JSON.stringify(v) : String(v),
              }))
            : [{ key: '', value: '' }]
        )
        setTemplateIds([])
        setAggregateField('amount')
        setAggregateOp('sum')
        setAggregatePeriod('quarter')
        setManualValue('')
        const pqc = preset.query_config ?? {}
        setShowLeaderboard(Boolean((pqc as Record<string, unknown>).show_leaderboard ?? false))
        setGoal(((pqc as Record<string, unknown>).goal as number) ?? '')
        setLeaderOverrides(((pqc as Record<string, unknown>).leader_overrides as LeaderOverride[]) ?? [])
        setFormat(preset.format)
        setCurrency(preset.currency)
        setShowTrend(preset.show_trend)
        setTrendPeriod(preset.trend_period)
        setSortOrder(0)
        setRefreshSeconds(preset.refresh_seconds)
      } else {
        setName('')
        setLabel('')
        setSourceType('integration')
        setIntegrationId('')
        setQueryConfigRows([{ key: '', value: '' }])
        setTemplateIds([])
        setAggregateField('amount')
        setAggregateOp('sum')
        setAggregatePeriod('quarter')
        setManualValue('')
        setShowLeaderboard(false)
        setGoal('')
        setLeaderOverrides([])
        setFormat('number')
        setCurrency('CAD')
        setShowTrend(true)
        setTrendPeriod('quarter')
        setSortOrder(0)
        setRefreshSeconds(300)
      }
      setError('')
    }
  }, [open, kpi, preset])

  const addQueryConfigRow = () => {
    setQueryConfigRows((prev) => [...prev, { key: '', value: '' }])
  }

  const removeQueryConfigRow = (i: number) => {
    setQueryConfigRows((prev) => prev.filter((_, idx) => idx !== i))
  }

  const updateQueryConfigRow = (i: number, field: keyof QueryConfigRow, value: string) => {
    setQueryConfigRows((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  const toggleTemplate = (id: string) => {
    setTemplateIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const addLeaderOverride = () => {
    const used = new Set(leaderOverrides.map((l) => l.team_member_id))
    const next = teamMembers.find((m) => !used.has(m.id))
    if (next) {
      setLeaderOverrides((prev) => [...prev, { team_member_id: next.id, value: 0 }])
    }
  }

  const updateLeaderOverride = (idx: number, field: keyof LeaderOverride, value: string | number) => {
    setLeaderOverrides((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx]!, [field]: value }
      return next
    })
  }

  const removeLeaderOverride = (idx: number) => {
    setLeaderOverrides((prev) => prev.filter((_, i) => i !== idx))
  }

  const buildQueryConfig = (): Record<string, unknown> => {
    if (sourceType === 'integration') {
      const obj: Record<string, unknown> = {}
      for (const row of queryConfigRows) {
        if (row.key.trim()) {
          const val = row.value.trim()
          if (val.startsWith('{')) {
            try {
              obj[row.key.trim()] = JSON.parse(val)
            } catch {
              obj[row.key.trim()] = val
            }
          } else if (val === 'true' || val === 'false') {
            obj[row.key.trim()] = val === 'true'
          } else if (!isNaN(Number(val))) {
            obj[row.key.trim()] = Number(val)
          } else {
            obj[row.key.trim()] = val
          }
        }
      }
      if (showLeaderboard) obj.show_leaderboard = true
      if (goal !== '' && !isNaN(Number(goal))) obj.goal = Number(goal)
      return obj
    }
    if (sourceType === 'celebration_aggregate') {
      const cfg: Record<string, unknown> = {
        template_ids: templateIds,
        field: aggregateField,
        aggregate: aggregateOp,
        period: aggregatePeriod,
        show_leaderboard: showLeaderboard,
      }
      if (goal !== '' && !isNaN(Number(goal))) cfg.goal = Number(goal)
      return cfg
    }
    if (sourceType === 'manual') {
      const cfg: Record<string, unknown> = {}
      if (showLeaderboard) cfg.show_leaderboard = true
      if (goal !== '' && !isNaN(Number(goal))) cfg.goal = Number(goal)
      if (leaderOverrides.length > 0) cfg.leader_overrides = leaderOverrides
      return cfg
    }
    return {}
  }

  const handleSave = async () => {
    setError('')
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!label.trim()) {
      setError('Label is required')
      return
    }
    if (sourceType === 'integration' && !integrationId) {
      setError('Select an integration')
      return
    }

    const queryConfig = buildQueryConfig()
    let cachedValue: unknown = null
    if (sourceType === 'manual') {
      const num = parseFloat(manualValue)
      cachedValue = isNaN(num) ? { value: manualValue } : { value: num }
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const payload = {
        org_id: orgId,
        name: name.trim(),
        label: label.trim(),
        source_type: sourceType,
        integration_id: sourceType === 'integration' ? integrationId : null,
        query_config: queryConfig,
        format,
        currency,
        show_trend: showTrend,
        trend_period: trendPeriod,
        sort_order: sortOrder,
        refresh_seconds: refreshSeconds,
        is_active: true,
        ...(sourceType === 'manual' && cachedValue ? { cached_value: cachedValue, cached_at: new Date().toISOString() } : {}),
      }

      if (isEdit) {
        const { error: updateError } = await supabase
          .from('kpi_definitions')
          .update(payload)
          .eq('id', kpi.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('kpi_definitions')
          .insert(payload)

        if (insertError) throw insertError
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save KPI')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit KPI' : 'Create KPI'}</DialogTitle>
          <DialogDescription>
            Define a metric to display on your TV dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Revenue This Quarter"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Display Label</Label>
            <Input
              id="label"
              placeholder="Revenue This Quarter"
              value={label}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">Shown on the KPI card</p>
          </div>

          <div className="space-y-2">
            <Label>Data Source</Label>
            <Select value={sourceType} onValueChange={setSourceType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_TYPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sourceType === 'integration' && (
            <>
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
                <Label>Query Config</Label>
                <p className="text-muted-foreground text-xs">
                  Key/value pairs for the integration query. Use JSON for objects, e.g. {'{"stage":"closedwon"}'}
                </p>
                <div className="space-y-2">
                  {queryConfigRows.map((row, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="endpoint, aggregate, field..."
                        value={row.key}
                        onChange={(e) => updateQueryConfigRow(i, 'key', e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="deals, sum, amount..."
                        value={row.value}
                        onChange={(e) => updateQueryConfigRow(i, 'value', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQueryConfigRow(i)}
                        disabled={queryConfigRows.length <= 1}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addQueryConfigRow}>
                    <Plus className="mr-1 size-3.5" />
                    Add
                  </Button>
                </div>
              </div>
            </>
          )}

          {sourceType === 'celebration_aggregate' && (
            <>
              <div className="space-y-2">
                <Label>Templates</Label>
                <p className="text-muted-foreground text-xs">Select celebration templates to aggregate from</p>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <Button
                      key={t.id}
                      type="button"
                      variant={templateIds.includes(t.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTemplate(t.id)}
                    >
                      {t.name}
                    </Button>
                  ))}
                  {templates.length === 0 && (
                    <p className="text-muted-foreground text-sm">No templates yet. Create celebration templates first.</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Input
                    placeholder="amount"
                    value={aggregateField}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAggregateField(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Aggregate</Label>
                  <Select value={aggregateOp} onValueChange={setAggregateOp}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGGREGATES.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={aggregatePeriod} onValueChange={setAggregatePeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TREND_PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {sourceType === 'manual' && (
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="text"
                placeholder="0 or 1,234,567"
                value={manualValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualValue(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">Manually set the displayed value</p>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">Display</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
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
                      <SelectTrigger>
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
              <div className="flex items-center justify-between">
                <Label>Show trend</Label>
                <Switch checked={showTrend} onCheckedChange={setShowTrend} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show leaderboard (top 3 contributors)</Label>
                <Switch checked={showLeaderboard} onCheckedChange={setShowLeaderboard} />
              </div>
              <div className="space-y-2">
                <Label>Goal (for pace/progress bar)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 220"
                  value={goal === '' ? '' : goal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const v = e.target.value
                    setGoal(v === '' ? '' : parseInt(v, 10) || '')
                  }}
                />
                <p className="text-muted-foreground text-xs">
                  Optional. When set, shows count/goal with progress bar (PaceKPICard).
                </p>
              </div>
              {showLeaderboard && sourceType === 'manual' && (
                <div className="space-y-2">
                  <Label>Leaderboard (team member + value)</Label>
                  <p className="text-muted-foreground text-xs">
                    Add up to 3 team members with their attributed value.
                  </p>
                  {leaderOverrides.map((lo, i) => (
                    <div key={i} className="flex gap-2">
                      <Select
                        value={lo.team_member_id}
                        onValueChange={(v) => updateLeaderOverride(i, 'team_member_id', v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select member" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Value"
                        className="w-24"
                        value={lo.value}
                        onChange={(e) =>
                          updateLeaderOverride(i, 'value', parseFloat(e.target.value) || 0)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLeaderOverride(i)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  {leaderOverrides.length < 3 && (
                    <Button variant="outline" size="sm" onClick={addLeaderOverride}>
                      <Plus className="mr-1 size-3.5" />
                      Add leader
                    </Button>
                  )}
                </div>
              )}
              {showLeaderboard && sourceType === 'celebration_aggregate' && (
                <p className="text-muted-foreground text-xs">
                  Leaders are computed from celebrations (aggregated by team member).
                </p>
              )}
              {showTrend && (
                <div className="space-y-2">
                  <Label>Trend period</Label>
                  <Select value={trendPeriod} onValueChange={setTrendPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TREND_PERIODS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Refresh (seconds)</Label>
                  <Input
                    type="number"
                    min={60}
                    value={refreshSeconds}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRefreshSeconds(parseInt(e.target.value, 10) || 300)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSortOrder(parseInt(e.target.value, 10) || 0)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
