'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AddIntegrationDialog } from './add-integration-dialog'
import { HubSpotConnectButton } from '@/components/admin/hubspot-connect-button'
import { Plug, Plus, Pencil, Trash2, AlertCircle, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const INTEGRATION_TYPES = [
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'slack', label: 'Slack' },
  { value: 'ga4', label: 'GA4' },
  { value: 'generic_webhook', label: 'Generic Webhook' },
] as const

type Integration = {
  id: string
  name: string
  type: string
  status: string
  last_synced_at: string | null
  config?: Record<string, unknown>
}

const STATUS_CONFIG = {
  active: { icon: CheckCircle, label: 'Active', className: 'text-emerald-600' },
  error: { icon: AlertCircle, label: 'Error', className: 'text-destructive' },
  disconnected: { icon: XCircle, label: 'Disconnected', className: 'text-muted-foreground' },
} as const

function formatDate(iso: string | null): string {
  if (!iso) return 'Never'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Never'
  }
}

export default function IntegrationsPage() {
  const { orgId, orgName, loading: orgLoading } = useOrg()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [integrationsLoading, setIntegrationsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addType, setAddType] = useState<string | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const fetchIntegrations = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('integrations')
      .select('id, name, type, status, last_synced_at, config')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (!error) setIntegrations((data as unknown as Integration[]) ?? [])
    setIntegrationsLoading(false)
  }, [orgId])

  useEffect(() => {
    if (orgId) {
      fetchIntegrations()
    } else if (!orgLoading) {
      setIntegrationsLoading(false)
    }
  }, [orgId, orgLoading, fetchIntegrations])

  const handleSyncTeam = async (id: string) => {
    setSyncingId(id)
    try {
      const res = await fetch(`/api/integrations/${id}/sync`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Sync failed')
      const { created = 0, updated = 0 } = data
      toast.success(`Team synced: ${created} created, ${updated} updated`)
      fetchIntegrations()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return
    const supabase = createClient()
    await supabase.from('integrations').delete().eq('id', id)
    fetchIntegrations()
  }

  const connectedTypes = new Set(integrations.map((i) => i.type))
  const availableToAdd = INTEGRATION_TYPES.filter((t) => !connectedTypes.has(t.value))
  const hasAddCards = availableToAdd.length > 0

  if (orgLoading || (!orgId && !orgLoading)) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Integrations</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Integrations</h1>
      <p className="mb-6 text-muted-foreground">
        Connect HubSpot, Slack, GA4, and other services to power your celebrations and KPIs.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orgId && (
          <Suspense fallback={<Card><CardContent className="pt-6"><div className="h-24 animate-pulse rounded bg-muted" /></CardContent></Card>}>
            <HubSpotConnectButton
              orgId={orgId}
              existingIntegration={
                integrations.find((i) => i.type === 'hubspot') ?? null
              }
              onRefresh={fetchIntegrations}
            />
          </Suspense>
        )}
        {integrationsLoading ? (
          <p className="text-muted-foreground">Loading integrations...</p>
        ) : integrations.length === 0 ? (
          <div className="col-span-full flex flex-1 flex-col items-center justify-center py-16">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <Plug className="mb-4 size-12 text-muted-foreground" />
              <h2 className="mb-2 text-lg font-semibold">No integrations connected yet</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Connect HubSpot, Slack, or a custom webhook to start receiving events.
              </p>
              <Button onClick={() => { setAddType(null); setDialogOpen(true) }}>
                Connect your first integration
              </Button>
            </div>
          </div>
        ) : (
          <>
            {integrations
              .filter((i) => i.type !== 'hubspot')
              .map((integration) => {
              const statusCfg = STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.disconnected
              const StatusIcon = statusCfg.icon
              const typeLabel = INTEGRATION_TYPES.find((t) => t.value === integration.type)?.label ?? integration.type

              return (
                <Card key={integration.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <Plug className="size-5 text-muted-foreground" />
                      <span className="font-medium">{integration.name}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">{typeLabel}</span>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <StatusIcon className={`size-4 ${statusCfg.className}`} />
                      <span className={statusCfg.className}>{statusCfg.label}</span>
                    </div>
                    <p className="mt-2 text-muted-foreground text-xs">
                      Last synced: {formatDate(integration.last_synced_at)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(integration.type === 'hubspot' || integration.type === 'slack') && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!!syncingId}
                          onClick={() => handleSyncTeam(integration.id)}
                        >
                          {syncingId === integration.id ? (
                            <Loader2 className="mr-1 size-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-1 size-3.5" />
                          )}
                          Sync Team
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex-1">
                        <Pencil className="mr-1 size-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(integration.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {availableToAdd
              .filter((t) => t.value !== 'hubspot')
              .map((t) => (
              <Card
                key={t.value}
                className="flex cursor-pointer flex-col items-center justify-center border-dashed py-8 transition-colors hover:border-primary/50 hover:bg-muted/30"
                onClick={() => {
                  setAddType(t.value)
                  setDialogOpen(true)
                }}
              >
                <Plus className="mb-2 size-10 text-muted-foreground" />
                <p className="font-medium">Add {t.label}</p>
                <p className="text-muted-foreground text-sm">Connect this service</p>
              </Card>
            ))}
            <Card
              className="flex cursor-pointer flex-col items-center justify-center border-dashed py-8 transition-colors hover:border-primary/50 hover:bg-muted/30"
              onClick={() => {
                setAddType(null)
                setDialogOpen(true)
              }}
            >
              <Plus className="mb-2 size-10 text-muted-foreground" />
              <p className="font-medium">Add Integration</p>
              <p className="text-muted-foreground text-sm">
                {hasAddCards ? 'Or choose another type' : 'Connect a service'}
              </p>
            </Card>
          </>
        )}
      </div>

      <AddIntegrationDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setAddType(null)
        }}
        orgId={orgId ?? ''}
        onSuccess={fetchIntegrations}
        initialType={addType as 'hubspot' | 'slack' | 'ga4' | 'generic_webhook' | undefined}
      />
    </div>
  )
}
