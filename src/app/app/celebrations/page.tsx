'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TemplateDialog } from './template-dialog'
import { TriggerSection } from './trigger-section'
import { CELEBRATION_PRESETS } from '@/lib/celebrations/presets'
import { Plus, Pencil, Trash2, PartyPopper } from 'lucide-react'

type Template = {
  id: string
  name: string
  title_pattern: string
  subtitle_pattern: string | null
  visual_style: string
  sound: string
  duration_seconds: number
  show_counter: boolean
  counter_label: string | null
  show_photos: boolean
  is_active: boolean
}

const SOUND_LABELS: Record<string, string> = {
  victory: 'Victory',
  cash_register: 'Cash register',
  bell: 'Bell',
  applause: 'Applause',
  none: 'None',
}

const VISUAL_LABELS: Record<string, string> = {
  confetti: 'Confetti',
  fireworks: 'Fireworks',
  champagne: 'Champagne',
}

export default function CelebrationsPage() {
  const { orgId, loading: orgLoading } = useOrg()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<(typeof CELEBRATION_PRESETS)[number] | null>(null)

  const fetchTemplates = useCallback(async () => {
    if (!orgId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('celebration_templates')
      .select('id, name, title_pattern, subtitle_pattern, visual_style, sound, duration_seconds, show_counter, counter_label, show_photos, is_active')
      .eq('org_id', orgId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    setTemplates((data as Template[]) ?? [])
    setLoading(false)
  }, [orgId])

  useEffect(() => {
    if (orgId) {
      fetchTemplates()
    } else if (!orgLoading) {
      setLoading(false)
    }
  }, [orgId, orgLoading, fetchTemplates])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template and its triggers?')) return
    const supabase = createClient()
    await supabase.from('celebration_templates').delete().eq('id', id)
    fetchTemplates()
  }

  const handleCreate = (preset?: (typeof CELEBRATION_PRESETS)[number]) => {
    setEditingTemplate(null)
    setSelectedPreset(preset ?? null)
    setTemplateDialogOpen(true)
  }

  const handleEdit = (t: Template) => {
    setEditingTemplate(t)
    setSelectedPreset(null)
    setTemplateDialogOpen(true)
  }

  const handleTemplateDialogClose = (open: boolean) => {
    setTemplateDialogOpen(open)
    if (!open) {
      setEditingTemplate(null)
      setSelectedPreset(null)
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
      <h1 className="mb-2 text-2xl font-semibold">Celebrations</h1>
      <p className="mb-6 text-muted-foreground">
        Create and manage celebration templates that appear when deals close or milestones are hit.
      </p>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-medium">Quick Start</h2>
        <div className="flex flex-wrap gap-2">
          {CELEBRATION_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              onClick={() => handleCreate(preset)}
            >
              {preset.name}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => handleCreate()}>
            Custom
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">Templates</h2>
          <Button onClick={() => handleCreate()}>
            <Plus className="mr-1 size-4" />
            Create Template
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading templates...</p>
        ) : templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PartyPopper className="mb-2 size-12 text-muted-foreground" />
              <p className="mb-2 font-medium">No templates yet</p>
              <p className="mb-4 text-center text-muted-foreground text-sm">
                Create a template from a preset above or start from scratch.
              </p>
              <Button onClick={() => handleCreate()}>
                <Plus className="mr-1 size-4" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="size-5 text-muted-foreground" />
                    <span className="font-medium">{template.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        template.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                      <Pencil className="mr-1 size-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Title:</span> {template.title_pattern}
                    </p>
                    <p className="text-muted-foreground">
                      {VISUAL_LABELS[template.visual_style] ?? template.visual_style} •{' '}
                      {SOUND_LABELS[template.sound] ?? template.sound} • {template.duration_seconds}s
                    </p>
                  </div>
                  <TriggerSection
                    templateId={template.id}
                    orgId={orgId ?? ''}
                    onUpdate={fetchTemplates}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <TemplateDialog
        open={templateDialogOpen}
        onOpenChange={handleTemplateDialogClose}
        orgId={orgId ?? ''}
        onSuccess={fetchTemplates}
        template={editingTemplate}
        preset={selectedPreset}
      />
    </div>
  )
}
