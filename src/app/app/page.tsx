'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-org'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

type Scenario = 'deal_won' | 'new_client' | 'contract_signed' | 'renewal' | 'random'

export default function AppPage() {
  const { orgId, loading: orgLoading } = useOrg()
  const [seeding, setSeeding] = useState(false)
  const [simulating, setSimulating] = useState<Scenario | null>(null)
  const [rapidFiring, setRapidFiring] = useState(false)

  const handleSeed = async () => {
    if (!orgId) {
      toast.error('No organization loaded')
      return
    }
    setSeeding(true)
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Seed failed')
      const { created } = data
      toast.success(
        `Seeded: ${created?.team_members ?? 0} members, ${created?.integrations ?? 0} integrations, ` +
          `${created?.templates ?? 0} templates, ${created?.triggers ?? 0} triggers, ${created?.kpis ?? 0} KPIs`
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const handleSimulate = async (scenario: Scenario) => {
    if (!orgId) {
      toast.error('No organization loaded')
      return
    }
    setSimulating(scenario)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, scenario }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Simulate failed')
      const created = data.webhook_response?.created ?? 0
      if (created > 0) {
        toast.success(`Simulation (${scenario}): ${created} celebration(s) created`)
      } else {
        toast.info(`Simulation (${scenario}): No celebrations created. Ensure seed data exists and triggers match.`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Simulate failed')
    } finally {
      setSimulating(null)
    }
  }

  const handleRapidFire = async () => {
    if (!orgId) {
      toast.error('No organization loaded')
      return
    }
    setRapidFiring(true)
    const scenarios: Scenario[] = ['deal_won', 'new_client', 'contract_signed', 'renewal', 'random']
    try {
      for (let i = 0; i < 5; i++) {
        const scenario = scenarios[Math.floor(Math.random() * scenarios.length)] as Scenario
        await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgId, scenario }),
        })
        if (i < 4) await new Promise((r) => setTimeout(r, 3000))
      }
      toast.success('Rapid fire: 5 celebrations sent (3s apart)')
    } catch (err) {
      toast.error('Rapid fire failed')
    } finally {
      setRapidFiring(false)
    }
  }

  const webhookUrl =
    typeof window !== 'undefined' && orgId
      ? `${window.location.origin}/api/webhooks/${orgId}/hubspot`
      : orgId
        ? `/api/webhooks/${orgId}/hubspot`
        : ''

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-6 text-muted-foreground">
        Overview of your celebration dashboard and activity.
      </p>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Welcome to CelebBoard</CardTitle>
          <CardDescription>Start by setting up integrations.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>

      {!orgLoading && orgId && (
        <Card className="mt-8 max-w-2xl">
          <CardHeader>
            <CardTitle>Developer Tools</CardTitle>
            <CardDescription>
              Seed test data and simulate webhook payloads for development.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-medium">Seed Test Data</p>
              <Button
                onClick={handleSeed}
                disabled={seeding}
                variant="secondary"
              >
                {seeding ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Seeding…
                  </>
                ) : (
                  'Seed Test Data'
                )}
              </Button>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Simulate Celebration</p>
              <div className="flex flex-wrap gap-2">
                {(['deal_won', 'new_client', 'contract_signed', 'renewal', 'random'] as const).map((scenario) => (
                  <Button
                    key={scenario}
                    onClick={() => handleSimulate(scenario)}
                    disabled={!!simulating}
                    variant="outline"
                    size="sm"
                  >
                    {simulating === scenario ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      scenario.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Rapid Fire</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Sends 5 random celebrations with 3-second delays to test the display queue.
              </p>
              <Button
                onClick={handleRapidFire}
                disabled={rapidFiring}
                variant="outline"
              >
                {rapidFiring ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Rapid Firing…
                  </>
                ) : (
                  'Rapid Fire'
                )}
              </Button>
            </div>

            {webhookUrl && (
              <div>
                <p className="mb-2 text-sm font-medium">Webhook URL</p>
                <code className="block rounded-md bg-muted px-3 py-2 text-xs break-all">
                  {webhookUrl}
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
