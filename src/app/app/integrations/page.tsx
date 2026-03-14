'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AddIntegrationDialog } from './add-integration-dialog'
import { IntegrationLogo } from '@/components/marketing/IntegrationLogo'
import { Plug, Trash2, AlertCircle, CheckCircle, XCircle, RefreshCw, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const INTEGRATION_TYPES = [
  {
    value: 'hubspot',
    label: 'HubSpot',
    description: 'CRM connection for deal celebrations, team sync, and HubSpot-powered KPIs.',
    logo: 'hubspot',
  },
  {
    value: 'slack',
    label: 'Slack',
    description: 'Sync team members from Slack and use Slack-based activity as an event source.',
    logo: 'slack',
  },
  {
    value: 'ga4',
    label: 'GA4',
    description: 'Store Google Analytics credentials now and wire them into KPI cards as the backend catches up.',
    logo: 'ga4',
  },
  {
    value: 'generic_webhook',
    label: 'Generic Webhook',
    description: 'Receive custom JSON events from any tool that can send webhooks.',
    logo: null,
  },
] as const

type IntegrationType = (typeof INTEGRATION_TYPES)[number]['value']

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
  const { orgId, loading: orgLoading } = useOrg()
  const searchParams = useSearchParams()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [integrationsLoading, setIntegrationsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addType, setAddType] = useState<IntegrationType | null>(null)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [refreshingSchemaId, setRefreshingSchemaId] = useState<string | null>(null)

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
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (!connected && !error) return

    if (connected === 'hubspot') {
      toast.success('HubSpot connected successfully!')
      void fetchIntegrations()
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        missing_hubspot_config: 'HubSpot OAuth is not configured. Add HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET to your local env.',
        missing_org_id: 'Could not start HubSpot connect because the organization ID is missing.',
        unauthorized: 'You need to be signed in before connecting HubSpot.',
        forbidden: 'You do not have access to connect HubSpot for this organization.',
        connection_failed: 'HubSpot connection failed. Check your HubSpot env configuration and try again.',
        invalid_state: 'HubSpot rejected the callback state. Try the connection again.',
      }
      toast.error(errorMessages[error] ?? 'The integration connection could not be completed.')
    }

    const url = new URL(window.location.href)
    url.searchParams.delete('connected')
    url.searchParams.delete('error')
    window.history.replaceState({}, '', url.toString())
  }, [fetchIntegrations, searchParams])

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

  const handleRefreshSchema = async (id: string) => {
    if (!orgId) return

    setRefreshingSchemaId(id)
    try {
      const res = await fetch(`/api/integrations/hubspot/schema?org_id=${orgId}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Refresh failed')
      toast.success('HubSpot schema refreshed')
      fetchIntegrations()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refresh failed')
    } finally {
      setRefreshingSchemaId(null)
    }
  }

  const handleDisconnectHubSpot = () => {
    toast.info('HubSpot disconnect is not implemented yet. Remove the integration if you need to reset it.')
  }

  const integrationByType = new Map(integrations.map((integration) => [integration.type as IntegrationType, integration]))

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
        {integrationsLoading ? (
          <div className="col-span-full flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading integrations...
          </div>
        ) : (
          <>
            {INTEGRATION_TYPES.map((typeDef) => {
              const integration = integrationByType.get(typeDef.value)
              const isConnected = !!integration
              const statusCfg = integration
                ? STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.disconnected
                : null
              const StatusIcon = statusCfg?.icon

              return (
                <Card key={typeDef.value} className={isConnected ? '' : 'border-dashed'}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg border bg-background">
                        {typeDef.logo ? (
                          <IntegrationLogo name={typeDef.logo} size={22} />
                        ) : (
                          <Plug className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{typeDef.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {integration?.name ?? typeDef.label}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isConnected ? 'default' : 'outline'}>
                      {isConnected ? 'Connected' : 'Available'}
                    </Badge>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground">{typeDef.description}</p>

                    {integration && StatusIcon ? (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-2 text-sm">
                          <StatusIcon className={`size-4 ${statusCfg.className}`} />
                          <span className={statusCfg.className}>{statusCfg.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last synced: {formatDate(integration.last_synced_at)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(integration.type === 'hubspot' || integration.type === 'slack') && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!!syncingId}
                              onClick={() => handleSyncTeam(integration.id)}
                            >
                              {syncingId === integration.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="size-3.5" />
                              )}
                              Sync Team
                            </Button>
                          )}

                          {integration.type === 'hubspot' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={refreshingSchemaId === integration.id}
                              onClick={() => handleRefreshSchema(integration.id)}
                            >
                              {refreshingSchemaId === integration.id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <ExternalLink className="size-3.5" />
                              )}
                              Refresh Schema
                            </Button>
                          )}

                          {integration.type === 'hubspot' ? (
                            <Button variant="outline" size="sm" onClick={handleDisconnectHubSpot}>
                              Disconnect
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(integration.id)}
                            >
                              <Trash2 className="size-3.5" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Not connected yet.
                        </p>
                        <Button
                          onClick={() => {
                            setAddType(typeDef.value)
                            setDialogOpen(true)
                          }}
                        >
                          Connect
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
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
        initialType={addType ?? undefined}
      />
    </div>
  )
}
