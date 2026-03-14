'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase-clients'
import { Copy, Check, ExternalLink } from 'lucide-react'

const INTEGRATION_TYPES = [
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'slack', label: 'Slack' },
  { value: 'ga4', label: 'GA4' },
  { value: 'generic_webhook', label: 'Generic Webhook' },
] as const

type IntegrationType = (typeof INTEGRATION_TYPES)[number]['value']

const HOW_IT_WORKS: Record<
  IntegrationType,
  {
    summary: string
    steps: string[]
    note?: string
  }
> = {
  hubspot: {
    summary: 'CelebBoard connects to your HubSpot portal through OAuth, then syncs the account into your workspace.',
    steps: [
      'Start the HubSpot OAuth flow from this modal.',
      'Approve access in HubSpot and return to CelebBoard.',
      'CelebBoard saves the connection, syncs owners, and prepares HubSpot for celebrations and KPIs.',
    ],
  },
  slack: {
    summary: 'Slack uses app credentials so CelebBoard can sync members and associate Slack activity with your team.',
    steps: [
      'Create or reuse a Slack app and copy its bot token and signing secret.',
      'Save the integration with those credentials.',
      'Run team sync so Slack users map into CelebBoard team members.',
    ],
  },
  ga4: {
    summary: 'GA4 stores analytics access details in your workspace so those metrics can power KPI cards.',
    steps: [
      'Add the GA4 property ID and service account credentials.',
      'Save the integration to attach GA4 to this workspace.',
      'Use the saved connection when building KPI cards that rely on analytics data.',
    ],
    note: 'GA4 credential storage is ready now. Full GA4-backed KPI refresh behavior is still catching up on the backend.',
  },
  generic_webhook: {
    summary: 'Generic Webhook gives you a shared endpoint for custom events from any system that can send JSON.',
    steps: [
      'Choose a display name and keep the generated webhook secret.',
      'Save the integration to activate the endpoint for this workspace.',
      'Send POST requests to the webhook URL with X-Webhook-Secret so CelebBoard can process the payload.',
    ],
  },
}

function generateWebhookSecret(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  onSuccess: () => void
  initialType?: IntegrationType
}

export function AddIntegrationDialog({ open, onOpenChange, orgId, onSuccess, initialType }: Props) {
  const [type, setType] = useState<IntegrationType>(initialType ?? 'hubspot')
  const [name, setName] = useState('')
  const [slackBotToken, setSlackBotToken] = useState('')
  const [slackSigningSecret, setSlackSigningSecret] = useState('')
  const [ga4PropertyId, setGa4PropertyId] = useState('')
  const [ga4ServiceEmail, setGa4ServiceEmail] = useState('')
  const [ga4PrivateKey, setGa4PrivateKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const selectedType = INTEGRATION_TYPES.find((item) => item.value === type)
  const howItWorks = HOW_IT_WORKS[type]

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/${orgId}/${type}`
    : ''

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName('')
      setType('hubspot')
      setSlackBotToken('')
      setSlackSigningSecret('')
      setGa4PropertyId('')
      setGa4ServiceEmail('')
      setGa4PrivateKey('')
      setWebhookSecret('')
      setError('')
      setCopied(false)
    } else {
      const nextType = initialType ?? 'hubspot'
      setType(nextType)
      if (nextType === 'generic_webhook') {
        setWebhookSecret(generateWebhookSecret())
      }
    }
    onOpenChange(next)
  }

  const handleTypeChange = (value: string) => {
    const nextType = value as IntegrationType
    setType(nextType)
    setError('')
    setCopied(false)
    if (nextType === 'generic_webhook') {
      setWebhookSecret(generateWebhookSecret())
    } else {
      setWebhookSecret('')
    }
  }

  useEffect(() => {
    if (open) {
      setType(initialType ?? 'hubspot')
    }
  }, [open, initialType])

  useEffect(() => {
    if (open && type === 'generic_webhook' && !webhookSecret) {
      setWebhookSecret(generateWebhookSecret())
    }
  }, [open, type, webhookSecret])

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleHubSpotConnect = () => {
    window.location.assign(`/api/integrations/hubspot/authorize?org_id=${orgId}`)
  }

  const getCredentials = (): Record<string, string> => {
    switch (type) {
      case 'slack':
        return { bot_token: slackBotToken, signing_secret: slackSigningSecret }
      case 'ga4':
        return {
          property_id: ga4PropertyId,
          service_account_email: ga4ServiceEmail,
          private_key: ga4PrivateKey,
        }
      case 'generic_webhook':
        return {}
      default:
        return {}
    }
  }

  const handleSave = async () => {
    setError('')
    const displayName = name.trim() || (INTEGRATION_TYPES.find((t) => t.value === type)?.label ?? type)
    if (!displayName) {
      setError('Name is required')
      return
    }

    if (type === 'slack' && (!slackBotToken.trim() || !slackSigningSecret.trim())) {
      setError('Bot token and signing secret are required')
      return
    }
    if (type === 'ga4' && (!ga4PropertyId.trim() || !ga4ServiceEmail.trim() || !ga4PrivateKey.trim())) {
      setError('Property ID, service account email, and private key are required')
      return
    }
    if (type === 'generic_webhook') {
      const secret = webhookSecret || generateWebhookSecret()
      setWebhookSecret(secret)
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const credentials = getCredentials()
      const secret = type === 'generic_webhook' ? (webhookSecret || generateWebhookSecret()) : null

      const { error: insertError } = await supabase.from('integrations').insert({
        org_id: orgId,
        type,
        name: displayName,
        credentials: Object.keys(credentials).length > 0 ? credentials : {},
        status: 'active',
        webhook_secret: secret,
      })

      if (insertError) throw insertError

      onSuccess()
      handleOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create integration')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect Integration</DialogTitle>
          <DialogDescription>Choose a source and complete the setup for your workspace.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Integration Type</Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTEGRATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium">
              How {selectedType?.label ?? 'this integration'} works
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{howItWorks.summary}</p>
            <ol className="mt-4 space-y-2">
              {howItWorks.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background text-xs font-medium text-foreground">
                    {index + 1}
                  </span>
                  <span className="text-foreground/90">{step}</span>
                </li>
              ))}
            </ol>
            {howItWorks.note ? (
              <p className="mt-4 rounded-md bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                {howItWorks.note}
              </p>
            ) : null}
          </div>

          {type !== 'hubspot' && (
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                placeholder={INTEGRATION_TYPES.find((t) => t.value === type)?.label ?? 'My Integration'}
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            </div>
          )}

          {type === 'hubspot' && (
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium">Start HubSpot OAuth</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You will be redirected to HubSpot, approve access, and return here with the integration connected.
              </p>
              <div className="mt-4">
                <Button type="button" onClick={handleHubSpotConnect}>
                  Continue with HubSpot
                  <ExternalLink className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {type === 'slack' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="slack-bot">Bot Token</Label>
                <Input
                  id="slack-bot"
                  type="password"
                  placeholder="xoxb-..."
                  value={slackBotToken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlackBotToken(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slack-secret">Signing Secret</Label>
                <Input
                  id="slack-secret"
                  type="password"
                  placeholder="..."
                  value={slackSigningSecret}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlackSigningSecret(e.target.value)}
                />
              </div>
            </>
          )}

          {type === 'ga4' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ga4-property">Property ID</Label>
                <Input
                  id="ga4-property"
                  placeholder="123456789"
                  value={ga4PropertyId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGa4PropertyId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ga4-email">Service Account Email</Label>
                <Input
                  id="ga4-email"
                  type="email"
                  placeholder="service@project.iam.gserviceaccount.com"
                  value={ga4ServiceEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGa4ServiceEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ga4-key">Private Key</Label>
                <Input
                  id="ga4-key"
                  type="password"
                  placeholder="-----BEGIN PRIVATE KEY-----..."
                  value={ga4PrivateKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGa4PrivateKey(e.target.value)}
                />
              </div>
            </>
          )}

          {type === 'generic_webhook' && (
            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <p className="text-muted-foreground text-sm">
                Use this in the X-Webhook-Secret header when sending requests.
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={webhookSecret}
                  onChange={() => {}}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const s = webhookSecret || generateWebhookSecret()
                    setWebhookSecret(s)
                    navigator.clipboard.writeText(s)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <p className="text-muted-foreground text-sm">
              {type === 'hubspot'
                ? 'HubSpot events return through OAuth, but this is still the route the app will use for webhook payloads.'
                : 'Configure this URL in your external service to send events.'}
            </p>
            <div className="flex gap-2">
              <Input readOnly value={webhookUrl} className="font-mono text-sm" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopyUrl}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          {type !== 'hubspot' ? (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
