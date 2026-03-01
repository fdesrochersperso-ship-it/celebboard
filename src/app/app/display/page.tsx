'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, Check, ExternalLink, RefreshCw } from 'lucide-react'

type DashboardConfig = {
  id: string
  theme: string
  feed_rotation_seconds: number
  quote_enabled: boolean
  custom_css: string | null
}

const THEMES = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
] as const

export default function DisplayPage() {
  const { orgId, loading: orgLoading } = useOrg()
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [displayToken, setDisplayToken] = useState<string | null>(null)
  const [theme, setTheme] = useState('dark')
  const [feedRotation, setFeedRotation] = useState(25)
  const [quoteEnabled, setQuoteEnabled] = useState(true)
  const [customCss, setCustomCss] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!orgId) return

    const supabase = createClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('display_token')
      .eq('id', orgId)
      .single()

    if (org?.display_token) setDisplayToken(org.display_token)

    const { data: cfg } = await supabase
      .from('dashboard_config')
      .select('id, theme, feed_rotation_seconds, quote_enabled, custom_css')
      .eq('org_id', orgId)
      .maybeSingle()

    if (cfg) {
      setConfig(cfg as DashboardConfig)
      setTheme(cfg.theme ?? 'dark')
      setFeedRotation(cfg.feed_rotation_seconds ?? 25)
      setQuoteEnabled(cfg.quote_enabled ?? true)
      setCustomCss(cfg.custom_css ?? '')
    } else {
      setTheme('dark')
      setFeedRotation(25)
      setQuoteEnabled(true)
      setCustomCss('')
    }

    setLoading(false)
  }, [orgId])

  useEffect(() => {
    if (orgId) {
      fetchData()
    } else if (!orgLoading) {
      setLoading(false)
    }
  }, [orgId, orgLoading, fetchData])

  const displayUrl =
    typeof window !== 'undefined' && displayToken
      ? `${window.location.origin}/display/${displayToken}`
      : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(displayUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!orgId) return
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        org_id: orgId,
        theme,
        feed_rotation_seconds: feedRotation,
        quote_enabled: quoteEnabled,
        custom_css: customCss.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (config) {
        await supabase.from('dashboard_config').update(payload).eq('id', config.id)
      } else {
        await supabase.from('dashboard_config').insert(payload)
      }

      fetchData()
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerate = async () => {
    if (!orgId) return
    setRegenerating(true)
    try {
      const res = await fetch('/api/org/regenerate-display-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to regenerate')

      setDisplayToken(data.display_token)
      setRegenerateOpen(false)
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to regenerate token')
    } finally {
      setRegenerating(false)
    }
  }

  if (orgLoading) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Display Settings</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!orgId) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Display Settings</h1>
        <p className="text-muted-foreground">
          No organization found. You may need to create an organization or ensure you&apos;re in an org.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Display Settings</h1>
      <p className="mb-6 text-muted-foreground">
        Configure theme, layout, and preview your TV dashboard before going live.
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>TV Display URL</CardTitle>
            <CardDescription>
              Open this URL on your office TV to show the dashboard. Keep it private.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                readOnly
                value={displayUrl}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={handleCopy} disabled={!displayUrl}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
              <Button
                variant="outline"
                asChild
              >
                <a href={displayUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 size-4" />
                  Preview
                </a>
              </Button>
              <Button
                variant="outline"
                className="text-amber-600 hover:text-amber-700"
                onClick={() => setRegenerateOpen(true)}
              >
                <RefreshCw className="mr-1 size-4" />
                Regenerate Token
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Customize how your dashboard appears.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="feed-rotation">Feed rotation (seconds)</Label>
              <Input
                id="feed-rotation"
                type="number"
                min={5}
                max={120}
                value={feedRotation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFeedRotation(parseInt(e.target.value, 10) || 25)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="quote-enabled">Quote widget enabled</Label>
              <Switch id="quote-enabled" checked={quoteEnabled} onCheckedChange={setQuoteEnabled} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-css">Custom CSS</Label>
              <textarea
                id="custom-css"
                className="border-input bg-background flex min-h-[100px] w-full rounded-md border px-3 py-2 font-mono text-sm"
                placeholder="/* Optional CSS overrides */"
                value={customCss}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomCss(e.target.value)}
              />
            </div>

            <Button onClick={handleSave} disabled={loading || saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Display Token</DialogTitle>
            <DialogDescription>
              This will invalidate the current display URL. Any TVs using the old URL will stop working. 
              You will need to update the URL on all displays. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateOpen(false)} disabled={regenerating}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRegenerate}
              disabled={regenerating}
            >
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
