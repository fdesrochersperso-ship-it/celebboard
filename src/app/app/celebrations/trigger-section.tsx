'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-clients'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TriggerDialog } from './trigger-dialog'
import { Plus, Pencil, Trash2, Zap } from 'lucide-react'

type Trigger = {
  id: string
  name: string
  event_type: string | null
  is_active: boolean
  integration_id: string
  conditions: unknown
  field_mapping: Record<string, string>
  integrations: { name: string } | null
}

type Props = {
  templateId: string
  orgId: string
  onUpdate: () => void
}

export function TriggerSection({ templateId, orgId, onUpdate }: Props) {
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTrigger, setEditingTrigger] = useState<Trigger | null>(null)

  const fetchTriggers = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('celebration_triggers')
      .select(`
        id,
        name,
        event_type,
        is_active,
        integration_id,
        conditions,
        field_mapping,
        integrations ( name )
      `)
      .eq('template_id', templateId)
      .order('created_at', { ascending: true })

    setTriggers((data as Trigger[]) ?? [])
    setLoading(false)
  }, [templateId])

  useEffect(() => {
    fetchTriggers()
  }, [fetchTriggers])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trigger?')) return
    const supabase = createClient()
    await supabase.from('celebration_triggers').delete().eq('id', id)
    fetchTriggers()
    onUpdate()
  }

  const handleEdit = (t: Trigger) => {
    setEditingTrigger(t)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) setEditingTrigger(null)
  }

  if (loading) return <p className="text-muted-foreground text-sm">Loading triggers...</p>

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-muted-foreground text-sm font-medium">Triggers</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingTrigger(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-1 size-3.5" />
          Add Trigger
        </Button>
      </div>

      {triggers.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          No triggers yet. Add one to connect this template to an integration.
        </p>
      ) : (
        <div className="space-y-2">
          {triggers.map((t) => (
            <Card key={t.id} className="py-2">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <Zap className="size-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.integrations?.name ?? 'Integration'} • {t.event_type ?? 'any event'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(t.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TriggerDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        orgId={orgId}
        templateId={templateId}
        trigger={editingTrigger}
        onSuccess={() => {
          fetchTriggers()
          onUpdate()
        }}
      />
    </div>
  )
}
