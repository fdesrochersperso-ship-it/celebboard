'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiForm } from '@/components/admin/kpi-builder/kpi-form'
import type { QueryConfigIntegration, QueryConfigCelebration } from '@/components/admin/kpi-builder/kpi-form'
import { toast } from 'sonner'

type KpiRow = {
  id: string
  name: string
  label: string
  source_type: string
  integration_id: string | null
  query_config: unknown
  format: string
  currency: string
  show_trend: boolean
  trend_period: string
  sort_order: number
  refresh_seconds: number
  is_active: boolean
  cached_value: unknown
  cached_at: string | null
}

function toFormInitialData(kpi: KpiRow) {
  const qc = (kpi.query_config ?? {}) as
    | QueryConfigIntegration
    | QueryConfigCelebration
    | Record<string, never>

  return {
    label: kpi.label,
    name: kpi.name,
    format: kpi.format,
    currency: kpi.currency,
    source_type: kpi.source_type as 'integration' | 'celebration_aggregate' | 'manual',
    integration_id: kpi.integration_id,
    query_config: qc,
    manual_value: ((): number | '' => {
      if (kpi.source_type !== 'manual') return ''
      const v = (kpi.cached_value as { value?: number })?.value
      return typeof v === 'number' ? v : ''
    })(),
    show_trend: kpi.show_trend,
    trend_period: kpi.trend_period,
    refresh_seconds: kpi.refresh_seconds,
    sort_order: kpi.sort_order,
    is_active: kpi.is_active,
    cached_value: kpi.cached_value,
    cached_at: kpi.cached_at,
  }
}

export default function EditKpiPage() {
  const params = useParams()
  const router = useRouter()
  const { orgId, loading: orgLoading } = useOrg()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [initialData, setInitialData] = useState<ReturnType<typeof toFormInitialData> | null>(null)

  useEffect(() => {
    if (!orgId || !id) return

    const supabase = createClient()
    supabase
      .from('kpi_definitions')
      .select(
        'id, name, label, source_type, integration_id, query_config, format, currency, show_trend, trend_period, sort_order, refresh_seconds, is_active, cached_value, cached_at'
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .single()
      .then(({ data, error }) => {
        setLoading(false)
        if (error || !data) {
          toast.error('KPI not found or you don\'t have access')
          router.push('/app/kpis')
          return
        }
        setInitialData(toFormInitialData(data as KpiRow))
      })
  }, [orgId, id, router])

  if (orgLoading || loading) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Edit KPI</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!initialData) {
    return null
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/kpis">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Edit KPI</h1>
          <p className="text-muted-foreground">
            Update your metric configuration
          </p>
        </div>
      </div>

      <KpiForm
        kpiId={id}
        initialData={initialData}
      />
    </div>
  )
}
