'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KpiDialog } from './kpi-dialog'
import { KPI_PRESETS } from '@/lib/kpis/presets'
import { BarChart3, Plus, Pencil, Trash2 } from 'lucide-react'

type Kpi = {
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
  refresh_seconds: number
  is_active: boolean
  cached_value: unknown
}

function formatCachedValue(cached: unknown, format: string): string {
  if (cached == null) return '—'
  if (typeof cached === 'object' && 'value' in cached) {
    const v = (cached as { value: unknown }).value
    if (typeof v === 'number') {
      if (format === 'currency') return `$${v.toLocaleString()}`
      if (format === 'percentage') return `${v}%`
      return v.toLocaleString()
    }
    return String(v)
  }
  if (typeof cached === 'number') {
    if (format === 'currency') return `$${cached.toLocaleString()}`
    return cached.toLocaleString()
  }
  return String(cached)
}

const SOURCE_LABELS: Record<string, string> = {
  integration: 'Integration',
  celebration_aggregate: 'Celebration Aggregate',
  manual: 'Manual',
}

export default function KPIsPage() {
  const { orgId, loading: orgLoading } = useOrg()
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKpi, setEditingKpi] = useState<Kpi | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<(typeof KPI_PRESETS)[number] | null>(null)

  const fetchKpis = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('kpi_definitions')
      .select('id, name, label, source_type, integration_id, query_config, format, currency, show_trend, trend_period, sort_order, refresh_seconds, is_active, cached_value')
      .eq('org_id', orgId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    setKpis((data as unknown as Kpi[]) ?? [])
    setLoading(false)
  }, [orgId])

  useEffect(() => {
    if (orgId) {
      fetchKpis()
    } else if (!orgLoading) {
      setLoading(false)
    }
  }, [orgId, orgLoading, fetchKpis])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this KPI?')) return
    const supabase = createClient()
    await supabase.from('kpi_definitions').delete().eq('id', id)
    fetchKpis()
  }

  const handleCreate = (preset?: (typeof KPI_PRESETS)[number]) => {
    setEditingKpi(null)
    setSelectedPreset(preset ?? null)
    setDialogOpen(true)
  }

  const handleEdit = (k: Kpi) => {
    setEditingKpi(k)
    setSelectedPreset(null)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingKpi(null)
      setSelectedPreset(null)
    }
  }

  if (orgLoading || (!orgId && !orgLoading)) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">KPIs</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">KPIs</h1>
      <p className="mb-6 text-muted-foreground">
        Define metrics like revenue, deals closed, and pipeline value to display on your dashboard.
      </p>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium">HubSpot Presets</h2>
        <div className="flex flex-wrap gap-2">
          {KPI_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => handleCreate(preset)}
            >
              {preset.name}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => handleCreate()}>
            Custom
          </Button>
        </div>
        <p className="mt-2 text-muted-foreground text-sm">
          Presets require a HubSpot integration. You&apos;ll select it when creating.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">KPI Definitions</h2>
          <Button onClick={() => handleCreate()}>
            <Plus className="mr-1 size-4" />
            Create KPI
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading KPIs...</p>
        ) : kpis.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-16">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <BarChart3 className="mb-4 size-12 text-muted-foreground" />
              <h2 className="mb-2 text-lg font-semibold">No KPIs defined yet</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Create a KPI from a preset above or define a custom metric to display on your dashboard.
              </p>
              <Button onClick={() => handleCreate()}>
                <Plus className="mr-1 size-4" />
                Create your first KPI
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => (
              <Card key={kpi.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-muted-foreground" />
                    <span className="font-medium">{kpi.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        kpi.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {kpi.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(kpi)}>
                      <Pencil className="mr-1 size-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(kpi.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCachedValue(kpi.cached_value, kpi.format)}
                  </p>
                  <p className="mt-2 text-muted-foreground text-xs">
                    {SOURCE_LABELS[kpi.source_type] ?? kpi.source_type} • {kpi.format} •{' '}
                    {kpi.trend_period} • Refresh {kpi.refresh_seconds}s
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <KpiDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        orgId={orgId ?? ''}
        onSuccess={fetchKpis}
        kpi={editingKpi}
        preset={selectedPreset}
      />
    </div>
  )
}
