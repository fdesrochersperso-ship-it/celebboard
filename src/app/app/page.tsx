'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useOrg } from '@/lib/hooks/use-org'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleCheckBig,
  CircleDashed,
  Copy,
  Loader2,
  Monitor,
  PartyPopper,
  Plug,
  Rocket,
  Sparkles,
  Users,
} from 'lucide-react'

type Scenario = 'deal_won' | 'new_client' | 'contract_signed' | 'renewal' | 'random'

type StepId =
  | 'connect_integration'
  | 'add_team'
  | 'create_celebration'
  | 'create_kpi'

type OnboardingStep = {
  id: StepId
  title: string
  description: string
  href: string
  ctaLabel: string
  completed: boolean
  detail: string
}

type OnboardingStatus = {
  org: {
    id: string
    name: string
    display_url: string
  }
  counts: {
    integrations: number
    team_members: number
    celebration_rules: number
    kpis: number
    celebrations: number
  }
  progress: {
    completed_steps: number
    total_steps: number
    percent: number
  }
  next_step: OnboardingStep | null
  steps: OnboardingStep[]
}

const STEP_ICONS: Record<StepId, typeof Plug> = {
  connect_integration: Plug,
  add_team: Users,
  create_celebration: PartyPopper,
  create_kpi: BarChart3,
}

const COUNT_CARDS: Array<{
  key: keyof OnboardingStatus['counts']
  label: string
}> = [
  { key: 'integrations', label: 'Integrations' },
  { key: 'team_members', label: 'Team members' },
  { key: 'celebration_rules', label: 'Celebration rules' },
  { key: 'kpis', label: 'KPI cards' },
]

export default function AppPage() {
  const { orgId, loading: orgLoading } = useOrg()
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [simulating, setSimulating] = useState<Scenario | null>(null)
  const [rapidFiring, setRapidFiring] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!orgId) return

    try {
      const res = await fetch('/api/onboarding/status', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to load onboarding status')
      }

      setStatus(data as OnboardingStatus)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load onboarding status')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    if (orgId) {
      void fetchStatus()
    } else if (!orgLoading) {
      setLoading(false)
    }
  }, [orgId, orgLoading, fetchStatus])

  const handleCopyDisplayUrl = async () => {
    if (!status?.org.display_url) return

    try {
      await navigator.clipboard.writeText(status.org.display_url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy display URL')
    }
  }

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
      await fetchStatus()
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
        toast.info(`Simulation (${scenario}): No celebrations created. Ensure your rules match the event.`)
      }
      await fetchStatus()
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
        if (i < 4) await new Promise((resolve) => setTimeout(resolve, 3000))
      }
      toast.success('Rapid fire: 5 celebrations sent')
      await fetchStatus()
    } catch {
      toast.error('Rapid fire failed')
    } finally {
      setRapidFiring(false)
    }
  }

  if (orgLoading || loading) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Getting Started</h1>
        <p className="text-muted-foreground">Loading your workspace...</p>
      </div>
    )
  }

  if (!orgId || !status) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Getting Started</h1>
        <p className="text-muted-foreground">
          We could not load your onboarding state. Refresh the page or try again.
        </p>
      </div>
    )
  }

  const isComplete = status.progress.completed_steps === status.progress.total_steps
  const nextStep = status.next_step
  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhooks/${orgId}/hubspot`
      : `/api/webhooks/${orgId}/hubspot`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Getting Started</h1>
        <p className="text-muted-foreground">
          Set up {status.org.name} so your team can start seeing wins on the display.
        </p>
      </div>

      <Card className="border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isComplete ? 'default' : 'secondary'}>
                  {status.progress.completed_steps}/{status.progress.total_steps} complete
                </Badge>
                {status.counts.celebrations > 0 && (
                  <Badge variant="outline">{status.counts.celebrations} live celebration(s)</Badge>
                )}
              </div>
              <CardTitle className="text-2xl">
                {isComplete ? 'Your workspace is ready' : 'Finish the initial setup'}
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm">
                {isComplete
                  ? 'You have the core pieces in place. Open the TV display and validate the full experience with a live event.'
                  : nextStep
                    ? `Next best action: ${nextStep.title.toLowerCase()}.`
                    : 'Complete the checklist below to launch your dashboard.'}
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {nextStep ? (
                <Button asChild>
                  <Link href={nextStep.href}>
                    {nextStep.ctaLabel}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <a href={status.org.display_url} target="_blank" rel="noopener noreferrer">
                  <Monitor className="size-4" />
                  Open TV display
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${status.progress.percent}%` }}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {COUNT_CARDS.map((card) => (
              <div key={card.key} className="rounded-lg border bg-background/80 p-4">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold">{status.counts[card.key]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Setup Checklist</CardTitle>
            <CardDescription>
              Complete these steps once. After that, the dashboard should be easy to maintain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {status.steps.map((step) => {
              const Icon = STEP_ICONS[step.id]

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex flex-col gap-4 rounded-xl border p-4 lg:flex-row lg:items-start lg:justify-between',
                    step.completed ? 'border-emerald-200 bg-emerald-50/60' : 'bg-background'
                  )}
                >
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border',
                        step.completed
                          ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                          : 'border-border bg-muted text-muted-foreground'
                      )}
                    >
                      {step.completed ? <CircleCheckBig className="size-5" /> : <Icon className="size-5" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{step.title}</p>
                        <Badge variant={step.completed ? 'default' : 'outline'}>
                          {step.completed ? 'Done' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      <p className="text-sm font-medium text-foreground">{step.detail}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button asChild variant={step.completed ? 'outline' : 'default'}>
                      <Link href={step.href}>
                        {step.completed ? 'Review' : step.ctaLabel}
                        {!step.completed && <ArrowRight className="size-4" />}
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>TV Display</CardTitle>
              <CardDescription>
                Open this on the office TV when you are ready to show the live dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input readOnly value={status.org.display_url} className="font-mono text-xs" />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleCopyDisplayUrl}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
                <Button asChild>
                  <a href={status.org.display_url} target="_blank" rel="noopener noreferrer">
                    <Monitor className="size-4" />
                    Preview display
                  </a>
                </Button>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                {status.counts.celebrations > 0 ? (
                  <div className="flex items-start gap-2">
                    <Sparkles className="mt-0.5 size-4 text-primary" />
                    <p>
                      You already have live celebration data. Open the display now and confirm the idle state and
                      overlay behavior.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <CircleDashed className="mt-0.5 size-4" />
                    <p>
                      Once your rules are configured, send a test event below to confirm the display updates in real
                      time.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What good looks like</CardTitle>
              <CardDescription>
                The setup is in good shape when these are all true.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-emerald-600" />
                <p>An integration is connected and the team list is populated.</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-emerald-600" />
                <p>At least one celebration rule can turn an external event into a TV moment.</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 text-emerald-600" />
                <p>The display has KPI cards and can be previewed on a separate screen.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <Card>
          <CardHeader>
            <CardTitle>Developer Tools</CardTitle>
            <CardDescription>
              Useful for local setup, demos, and validating the pipeline quickly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSeed} disabled={seeding} variant="secondary">
                {seeding ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Seeding demo data...
                  </>
                ) : (
                  <>
                    <Rocket className="size-4" />
                    Seed demo org
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleSimulate('random')}
                disabled={!!simulating}
                variant="outline"
              >
                {simulating === 'random' ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PartyPopper className="size-4" />
                )}
                Send test celebration
              </Button>

              <Button onClick={handleRapidFire} disabled={rapidFiring} variant="outline">
                {rapidFiring ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Rapid fire'
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Webhook URL</p>
              <code className="block rounded-md bg-muted px-3 py-2 text-xs break-all">{webhookUrl}</code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
