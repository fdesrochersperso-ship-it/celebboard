'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  RefreshCw,
  PartyPopper,
  PenLine,
} from 'lucide-react'
import { toast } from 'sonner'

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
  cached_at: string | null
}

function formatCachedValue(cached: unknown, format: string, currency: string): string {
  if (cached == null) return '—'
  let val: number | null = null
  if (typeof cached === 'object' && 'value' in cached) {
    const v = (cached as { value: unknown }).value
    if (typeof v === 'number') val = v
  } else if (typeof cached === 'number') {
    val = cached
  }
  if (val == null) return '—'
  if (format === 'currency') {
    const sym = { CAD: '$', USD: '$', EUR: '€', GBP: '£' }[currency] ?? '$'
    return `${sym}${val.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`
  }
  if (format === 'percentage') return `${val.toLocaleString()}%`
  return val.toLocaleString()
}

function formatRefreshInterval(seconds: number): string {
  if (seconds < 60) return `Every ${seconds} sec`
  if (seconds === 60) return 'Every 1 min'
  if (seconds < 3600) return `Every ${Math.round(seconds / 60)} min`
  return `Every ${Math.round(seconds / 3600)} hour`
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString()
}

const SOURCE_CONFIG: Record<
  string,
  { label: string; icon: typeof BarChart3 }
> = {
  integration: { label: 'HubSpot', icon: BarChart3 },
  celebration_aggregate: { label: 'Celebrations', icon: PartyPopper },
  manual: { label: 'Manual', icon: PenLine },
}

export default function KPIsPage() {
  const { orgId, loading: orgLoading } = useOrg()
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingKpi, setDeletingKpi] = useState<Kpi | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchKpis = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('kpi_definitions')
      .select('id, name, label, source_type, integration_id, query_config, format, currency, show_trend, trend_period, sort_order, refresh_seconds, is_active, cached_value, cached_at')
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

  const handleToggle = async (kpi: Kpi) => {
    setTogglingId(kpi.id)
    const prev = kpi.is_active
    setKpis((prevKpis) =>
      prevKpis.map((k) =>
        k.id === kpi.id ? { ...k, is_active: !prev } : k
      )
    )
    try {
      const res = await fetch(`/api/kpis/${kpi.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !prev }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to toggle')
      }
    } catch (err) {
      setKpis((prevKpis) =>
        prevKpis.map((k) =>
          k.id === kpi.id ? { ...k, is_active: prev } : k
        )
      )
      toast.error(err instanceof Error ? err.message : 'Failed to toggle')
    } finally {
      setTogglingId(null)
    }
  }

  const handleRefreshNow = async (kpi: Kpi) => {
    setRefreshingId(kpi.id)
    try {
      const res = await fetch(`/api/kpis/${kpi.id}/refresh`, {
        method: 'POST',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to refresh')
      }
      toast.success('Refreshed')
      fetchKpis()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to refresh')
    } finally {
      setRefreshingId(null)
    }
  }

  const handleDeleteClick = (kpi: Kpi) => {
    setDeletingKpi(kpi)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingKpi) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/kpis/${deletingKpi.id}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to delete')
      }
      toast.success('KPI deleted')
      setDeleteDialogOpen(false)
      setDeletingKpi(null)
      fetchKpis()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">KPIs</h1>
          <p className="text-muted-foreground">
            Define metrics like revenue, deals closed, and pipeline value to display on your dashboard.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/kpis/new">
            <Plus className="mr-1.5 size-4" />
            Create KPI
          </Link>
        </Button>
      </div>

      <section>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="bg-muted h-5 w-32 animate-pulse rounded" />
                    <div className="bg-muted h-5 w-16 animate-pulse rounded" />
                  </div>
                  <div className="mb-2 bg-muted h-8 w-24 animate-pulse rounded" />
                  <div className="mb-3 bg-muted h-4 w-40 animate-pulse rounded" />
                  <div className="mt-auto flex gap-2">
                    <div className="bg-muted h-8 w-16 animate-pulse rounded" />
                    <div className="bg-muted h-8 w-8 animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : kpis.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <BarChart3 className="mb-4 size-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold">No KPIs configured yet</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Add your first metric to display on your TV dashboard.
            </p>
            <Button asChild>
              <Link href="/app/kpis/new">
                <Plus className="mr-1.5 size-4" />
                Add your first KPI
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => {
              const src = SOURCE_CONFIG[kpi.source_type] ?? {
                label: kpi.source_type,
                icon: BarChart3,
              }
              const Icon = src.icon
              return (
                <Card key={kpi.id} className="flex flex-col">
                  <CardContent className="flex flex-1 flex-col p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{kpi.label}</h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${kpi.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}
                        >
                          {kpi.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <Switch
                          checked={kpi.is_active}
                          onCheckedChange={() => handleToggle(kpi)}
                          disabled={togglingId === kpi.id}
                        />
                      </div>
                    </div>

                    <p className="mb-2 text-2xl font-bold tabular-nums">
                      {formatCachedValue(kpi.cached_value, kpi.format, kpi.currency)}
                    </p>

                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                        <Icon className="size-3.5" />
                        {src.label}
                      </span>
                    </div>

                    <p className="mb-4 text-xs text-muted-foreground">
                      <span className="font-medium">Refreshes:</span>{' '}
                      {formatRefreshInterval(kpi.refresh_seconds)}
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      <span className="font-medium">Last refreshed:</span>{' '}
                      {formatRelativeTime(kpi.cached_at)}
                    </p>

                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/app/kpis/${kpi.id}`}>
                          <Pencil className="mr-1 size-3.5" />
                          Edit
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                            <span className="sr-only">More</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault()
                              handleRefreshNow(kpi)
                            }}
                            disabled={refreshingId === kpi.id}
                          >
                            <RefreshCw
                              className={`mr-2 size-4 ${refreshingId === kpi.id ? 'animate-spin' : ''}`}
                            />
                            Refresh Now
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => {
                              e.preventDefault()
                              handleDeleteClick(kpi)
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deletingKpi?.label}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the KPI from your dashboard. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
