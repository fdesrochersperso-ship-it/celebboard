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
import { Copy, Check } from 'lucide-react'

const INTEGRATION_TYPES = [
  { value: 'hubspot', label: 'HubSpot' },
  { value: 'slack', label: 'Slack' },
  { value: 'ga4', label: 'GA4' },
  { value: 'generic_webhook', label: 'Generic Webhook' },
] as const

type IntegrationType = (typeof INTEGRATION_TYPES)[number]['value']

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
  const [hubspotToken, setHubspotToken] = useState('')
  const [slackBotToken, setSlackBotToken] = useState('')
  const [slackSigningSecret, setSlackSigningSecret] = useState('')
  const [ga4PropertyId, setGa4PropertyId] = useState('')
  const [ga4ServiceEmail, setGa4ServiceEmail] = useState('')
  const [ga4PrivateKey, setGa4PrivateKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/${orgId}/${type}`
    : ''

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setName('')
      setType('hubspot')
      setHubspotToken('')
      setSlackBotToken('')
      setSlackSigningSecret('')
      setGa4PropertyId('')
      setGa4ServiceEmail('')
      setGa4PrivateKey('')
      setWebhookSecret('')
      setError('')
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
    setType(value as IntegrationType)
    if (value === 'generic_webhook') {
      setWebhookSecret(generateWebhookSecret())
    }
  }

  useEffect(() => {
    if (open) {
      if (initialType) setType(initialType)
      if (type === 'generic_webhook' && !webhookSecret) {
        setWebhookSecret(generateWebhookSecret())
      }
    }
  }, [open, initialType, type, webhookSecret])

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getCredentials = (): Record<string, string> => {
    switch (type) {
      case 'hubspot':
        return { access_token: hubspotToken }
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

    if (type === 'hubspot' && !hubspotToken.trim()) {
      setError('API access token is required')
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
          <DialogTitle>Add Integration</DialogTitle>
          <DialogDescription>Connect an external service to power celebrations and KPIs.</DialogDescription>
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

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              placeholder={INTEGRATION_TYPES.find((t) => t.value === type)?.label ?? 'My Integration'}
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>

          {type === 'hubspot' && (
            <div className="space-y-2">
              <Label htmlFor="hubspot-token">API Access Token</Label>
              <Input
                id="hubspot-token"
                type="password"
                placeholder="pat-na1-..."
                value={hubspotToken}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHubspotToken(e.target.value)}
              />
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
              Configure this URL in your external service to send events.
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
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
