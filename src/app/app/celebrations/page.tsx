'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { conditionsToText } from '@/lib/celebrations/conditions-to-text'
import { useCelebrationWizardStore } from '@/stores/celebration-wizard'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Copy,
  MoreVertical,
  Trash2,
  History,
  PartyPopper,
  Trophy,
  Handshake,
  Sparkles,
  PenLine,
} from 'lucide-react'

const VISUAL_LABELS: Record<string, string> = {
  confetti: 'Confetti',
  fireworks: 'Fireworks',
  champagne: 'Champagne',
}

const SOUND_LABELS: Record<string, string> = {
  victory: 'Victory Fanfare',
  cash_register: 'Cash Register',
  bell: 'Bell',
  applause: 'Applause',
  drumroll: 'Drumroll',
  none: 'No Sound',
}

const QUICK_START_PRESETS = [
  { id: 'deal_won' as const, name: 'Deal Won', icon: Trophy },
  { id: 'new_client' as const, name: 'New Client', icon: Handshake },
  { id: 'big_deal' as const, name: 'Big Deal', icon: Sparkles },
  { id: 'start_blank' as const, name: 'Custom', icon: PenLine },
] as const

type TemplateWithTrigger = {
  id: string
  name: string
  title_pattern: string
  subtitle_pattern: string | null
  visual_style: string
  sound: string
  duration_seconds: number
  show_counter: boolean
  counter_label: string | null
  counter_source: string | null
  show_photos: boolean
  photo_fields: string[]
  is_active: boolean
  trigger: {
    id: string
    integration_id: string
    event_type: string | null
    conditions: Array<{
      field: string
      operator?: string
      op?: string
      value: unknown
      property_label?: string
    }>
    field_mapping: Record<string, string>
  } | null
  stats: { lastFired: string | null; total: number }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  return date.toLocaleDateString()
}

export default function CelebrationsPage() {
  const router = useRouter()
  const { orgId, loading: orgLoading } = useOrg()
  const hydrateFromTemplate = useCelebrationWizardStore((s) => s.hydrateFromTemplate)

  const [items, setItems] = useState<TemplateWithTrigger[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateWithTrigger | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    const { data: templates } = await supabase
      .from('celebration_templates')
      .select('id, name, title_pattern, subtitle_pattern, visual_style, sound, duration_seconds, show_counter, counter_label, counter_source, show_photos, photo_fields, is_active')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (!templates?.length) {
      setItems([])
      setLoading(false)
      return
    }

    const templateIds = templates.map((t) => t.id)

    const { data: triggers } = await supabase
      .from('celebration_triggers')
      .select('id, template_id, integration_id, event_type, conditions, field_mapping')
      .eq('org_id', orgId)
      .in('template_id', templateIds)

    const { data: celebrations } = await supabase
      .from('celebrations')
      .select('template_id, displayed_at, created_at')
      .eq('org_id', orgId)
      .in('template_id', templateIds)

    const triggerByTemplate = new Map<string, NonNullable<typeof triggers>[number]>()
    for (const t of triggers ?? []) {
      if (!triggerByTemplate.has(t.template_id)) {
        triggerByTemplate.set(t.template_id, t)
      }
    }

    const statsByTemplate = new Map<string, { lastFired: Date | null; total: number }>()
    for (const c of celebrations ?? []) {
      const existing = statsByTemplate.get(c.template_id) ?? { lastFired: null, total: 0 }
      existing.total += 1
      const ts = c.displayed_at ?? c.created_at
      if (ts) {
        const d = new Date(ts)
        if (!existing.lastFired || d > existing.lastFired) {
          existing.lastFired = d
        }
      }
      statsByTemplate.set(c.template_id, existing)
    }

    const combined: TemplateWithTrigger[] = templates.map((t) => {
      const trigger = triggerByTemplate.get(t.id) ?? null
      const stats = statsByTemplate.get(t.id) ?? { lastFired: null, total: 0 }
      return {
        ...t,
        trigger: trigger
          ? {
              id: trigger.id,
              integration_id: trigger.integration_id,
              event_type: trigger.event_type,
              conditions: (trigger.conditions as typeof trigger.conditions) ?? [],
              field_mapping: (trigger.field_mapping as Record<string, string>) ?? {},
            }
          : null,
        stats: {
          lastFired: stats.lastFired ? formatRelativeTime(stats.lastFired) : null,
          total: stats.total,
        },
      }
    })

    setItems(combined)
    setLoading(false)
  }, [orgId])

  useEffect(() => {
    if (orgId) {
      fetchData()
    } else if (!orgLoading) {
      setLoading(false)
    }
  }, [orgId, orgLoading, fetchData])

  const handleQuickStart = (presetId: (typeof QUICK_START_PRESETS)[number]['id']) => {
    router.push(`/app/celebrations/new?starter=${presetId}`)
  }

  const handleToggle = async (item: TemplateWithTrigger) => {
    const nextActive = !item.is_active
    setTogglingId(item.id)
    setItems((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, is_active: nextActive } : t))
    )
    try {
      const res = await fetch(`/api/celebrations/${item.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Toggle failed')
      toast.success(nextActive ? 'Celebration activated' : 'Celebration deactivated')
    } catch (err) {
      setItems((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, is_active: item.is_active } : t))
      )
      toast.error(err instanceof Error ? err.message : 'Failed to toggle')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDuplicate = async (item: TemplateWithTrigger) => {
    if (!item.trigger) {
      toast.error('Cannot duplicate: no trigger data')
      return
    }
    hydrateFromTemplate(
      {
        template: {
          id: item.id,
          name: item.name,
          title_pattern: item.title_pattern,
          subtitle_pattern: item.subtitle_pattern,
          visual_style: item.visual_style,
          sound: item.sound,
          duration_seconds: item.duration_seconds,
          show_counter: item.show_counter,
          counter_label: item.counter_label,
          counter_source: item.counter_source,
          show_photos: item.show_photos,
          photo_fields: item.photo_fields ?? [],
          is_active: item.is_active,
        },
        trigger: item.trigger,
      },
      { appendCopy: true }
    )
    router.push('/app/celebrations/new?duplicate=1')
  }

  const handleDeleteClick = (item: TemplateWithTrigger) => {
    setDeletingTemplate(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTemplate) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/celebrations/${deletingTemplate.id}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      setItems((prev) => prev.filter((t) => t.id !== deletingTemplate.id))
      setDeleteDialogOpen(false)
      setDeletingTemplate(null)
      toast.success('Celebration deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  if (orgLoading || (!orgId && !orgLoading)) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Celebrations</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Celebrations</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage celebration templates that appear when deals close or milestones are hit.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/celebrations/new">
            <Plus className="mr-1.5 size-4" />
            Create Celebration
          </Link>
        </Button>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Quick Start</h2>
        <div className="flex flex-wrap gap-3">
          {QUICK_START_PRESETS.map((preset) => {
            const Icon = preset.icon
            return (
              <Button
                key={preset.id}
                variant="outline"
                className="h-auto flex-col gap-1.5 py-3 px-4"
                onClick={() => handleQuickStart(preset.id)}
              >
                <Icon className="size-5" />
                <span>{preset.name}</span>
              </Button>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">Your Celebrations</h2>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="mb-3 h-5 w-2/3 rounded bg-muted" />
                  <div className="mb-2 h-4 w-full rounded bg-muted" />
                  <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <PartyPopper className="mb-4 size-12 text-muted-foreground" />
            <h2 className="mb-2 text-lg font-semibold">No celebrations yet</h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Create your first one to celebrate deals and milestones on your display.
            </p>
            <Button asChild>
              <Link href="/app/celebrations/new">
                <Plus className="mr-1.5 size-4" />
                Create your first celebration
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs ${item.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}
                      >
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => handleToggle(item)}
                        disabled={togglingId === item.id}
                      />
                    </div>
                  </div>

                  {item.trigger && (
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-medium">When:</span>{' '}
                      {conditionsToText(item.trigger.conditions)}
                    </p>
                  )}

                  <p className="mb-3 text-sm text-muted-foreground">
                    {VISUAL_LABELS[item.visual_style] ?? item.visual_style} ·{' '}
                    {SOUND_LABELS[item.sound] ?? item.sound} · {item.duration_seconds}s
                  </p>

                  <div className="mb-4 text-xs text-muted-foreground">
                    Last fired: {item.stats.lastFired ?? 'Never'} · {item.stats.total} total
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/app/celebrations/${item.id}`}>
                        <Pencil className="mr-1 size-3.5" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(item)}
                      disabled={!item.trigger}
                    >
                      <Copy className="mr-1 size-3.5" />
                      Duplicate
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
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => {
                            e.preventDefault()
                            handleDeleteClick(item)
                          }}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/app/history?template=${item.id}`}>
                            <History className="mr-2 size-4" />
                            View History
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deletingTemplate?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will stop all celebrations using this template. This cannot be undone.
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
