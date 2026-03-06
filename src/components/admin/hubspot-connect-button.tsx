'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IntegrationLogo } from '@/components/marketing/IntegrationLogo'
import { toast } from 'sonner'
import { RefreshCw, Loader2, Unplug } from 'lucide-react'

type HubSpotIntegration = {
  id: string
  status: string
  config?: {
    portal_id?: string
    hub_domain?: string
    schema_last_synced?: string
    owners_last_synced?: string
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Never'
  }
}

interface HubSpotConnectButtonProps {
  orgId: string
  existingIntegration?: HubSpotIntegration | null
  onRefresh?: () => void
}

export function HubSpotConnectButton({
  orgId,
  existingIntegration,
}: HubSpotConnectButtonProps) {
  const searchParams = useSearchParams()
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const isConnected =
    existingIntegration && existingIntegration.status === 'active'
  const hubDomain =
    existingIntegration?.config?.hub_domain ??
    existingIntegration?.config?.portal_id ??
    null

  useEffect(() => {
    if (searchParams.get('connected') === 'hubspot') {
      toast.success('HubSpot connected successfully!')
      // Clear the query param without full reload
      const url = new URL(window.location.href)
      url.searchParams.delete('connected')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  const handleRefreshSchema = async () => {
    setRefreshing(true)
    try {
      const res = await fetch(
        `/api/integrations/hubspot/schema?org_id=${orgId}`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Refresh failed')
      toast.success('Schema refreshed')
      onRefresh?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const handleDisconnectClick = () => {
    setDisconnectOpen(true)
  }

  const handleDisconnectConfirm = () => {
    // TODO: Call disconnect endpoint when available
    toast.info('Disconnect endpoint coming soon')
    setDisconnectOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <IntegrationLogo name="hubspot" size={24} />
            <span className="font-medium">HubSpot</span>
            {isConnected && (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Connect your HubSpot CRM to celebrate deals, sync team members, and
            display live KPIs.
          </p>

          {!isConnected ? (
            <a
              href={`/api/integrations/hubspot/authorize?org_id=${orgId}`}
              className="mt-4 inline-block"
            >
              <Button>Connect HubSpot</Button>
            </a>
          ) : (
            <div className="mt-4 space-y-3">
              {hubDomain && (
                <p className="text-muted-foreground text-xs">
                  Portal: {hubDomain}
                </p>
              )}
              <div className="text-muted-foreground text-xs space-y-1">
                <p>Schema synced: {formatDate(existingIntegration?.config?.schema_last_synced)}</p>
                <p>Owners synced: {formatDate(existingIntegration?.config?.owners_last_synced)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  onClick={handleRefreshSchema}
                >
                  {refreshing ? (
                    <Loader2 className="mr-1 size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-1 size-3.5" />
                  )}
                  Refresh Schema
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnectClick}
                >
                  <Unplug className="mr-1 size-3.5" />
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect HubSpot?</DialogTitle>
            <DialogDescription>
              This will remove the HubSpot connection. You can reconnect at any
              time. Celebrations and triggers that depend on HubSpot will stop
              working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button variant="outline" onClick={() => setDisconnectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnectConfirm}>
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
