'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-clients'
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
import { Plus, Trash2 } from 'lucide-react'

const CONDITION_OPS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'not contains' },
] as const

type ConditionRow = { field: string; op: string; value: string }
type FieldMappingRow = { key: string; value: string }

type Integration = { id: string; name: string; type: string }
type Trigger = {
  id: string
  name: string
  event_type: string | null
  conditions: unknown
  field_mapping: Record<string, string>
  integration_id: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  templateId: string
  trigger: Trigger | null
  onSuccess: () => void
}

export function TriggerDialog({ open, onOpenChange, orgId, templateId, trigger, onSuccess }: Props) {
  const isEdit = !!trigger

  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [name, setName] = useState('')
  const [integrationId, setIntegrationId] = useState('')
  const [eventType, setEventType] = useState('')
  const [conditions, setConditions] = useState<ConditionRow[]>([{ field: '', op: 'eq', value: '' }])
  const [fieldMapping, setFieldMapping] = useState<FieldMappingRow[]>([{ key: '', value: '' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && orgId) {
      const supabase = createClient()
      supabase
        .from('integrations')
        .select('id, name, type')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .then(({ data }) => setIntegrations((data as unknown as Integration[]) ?? []))
    }
  }, [open, orgId])

  useEffect(() => {
    if (open) {
      if (trigger) {
        setName(trigger.name)
        setIntegrationId(trigger.integration_id)
        setEventType(trigger.event_type ?? '')
        const conds = ((trigger.conditions as { field: string; op: string; value: unknown }[]) ?? []).map((c) => ({
          field: c.field,
          op: c.op,
          value: String(c.value ?? ''),
        }))
        setConditions(conds.length > 0 ? conds : [{ field: '', op: 'eq', value: '' }])
        const mapping = trigger.field_mapping ?? {}
        const rows = Object.entries(mapping).map(([k, v]) => ({ key: k, value: String(v) }))
        setFieldMapping(rows.length > 0 ? rows : [{ key: '', value: '' }])
      } else {
        setName('')
        setIntegrationId('')
        setEventType('')
        setConditions([{ field: '', op: 'eq', value: '' }])
        setFieldMapping([{ key: '', value: '' }])
      }
      setError('')
    }
  }, [open, trigger])

  const addCondition = () => {
    setConditions((prev) => [...prev, { field: '', op: 'eq', value: '' }])
  }

  const removeCondition = (i: number) => {
    setConditions((prev) => prev.filter((_, idx) => idx !== i))
  }

  const updateCondition = (i: number, field: keyof ConditionRow, value: string) => {
    setConditions((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  const addFieldMapping = () => {
    setFieldMapping((prev) => [...prev, { key: '', value: '' }])
  }

  const removeFieldMapping = (i: number) => {
    setFieldMapping((prev) => prev.filter((_, idx) => idx !== i))
  }

  const updateFieldMapping = (i: number, field: keyof FieldMappingRow, value: string) => {
    setFieldMapping((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  const handleSave = async () => {
    setError('')
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!integrationId) {
      setError('Select an integration')
      return
    }

    const conditionsFiltered = conditions
      .filter((c) => c.field.trim())
      .map((c) => ({ field: c.field.trim(), op: c.op as string, value: c.value }))

    const mappingObj: Record<string, string> = {}
    for (const row of fieldMapping) {
      if (row.key.trim()) {
        mappingObj[row.key.trim()] = row.value.trim()
      }
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const payload = {
        org_id: orgId,
        integration_id: integrationId,
        template_id: templateId,
        name: name.trim(),
        event_type: eventType.trim() || null,
        conditions: conditionsFiltered,
        field_mapping: mappingObj,
        is_active: true,
      }

      if (isEdit) {
        const { error: updateError } = await supabase
          .from('celebration_triggers')
          .update(payload)
          .eq('id', trigger.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('celebration_triggers')
          .insert(payload)

        if (insertError) throw insertError
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trigger')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Trigger' : 'Add Trigger'}</DialogTitle>
          <DialogDescription>
            Connect this template to an integration. When matching events arrive, a celebration is created.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="trigger-name">Trigger Name</Label>
            <Input
              id="trigger-name"
              placeholder="HubSpot Deal Won"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Integration</Label>
            <Select value={integrationId} onValueChange={setIntegrationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select integration" />
              </SelectTrigger>
              <SelectContent>
                {integrations.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name} ({i.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-type">Event Type</Label>
            <Input
              id="event-type"
              placeholder="deal.won, deal.created, etc."
              value={eventType}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEventType(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">Integration-specific event identifier. Leave empty for generic webhooks.</p>
          </div>

          <div className="space-y-2">
            <Label>Conditions</Label>
            <p className="text-muted-foreground text-xs">All conditions must match (AND). Use payload paths for field, e.g. amount or data.deal.value</p>
            <div className="space-y-2">
              {conditions.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="field"
                    value={c.field}
                    onChange={(e) => updateCondition(i, 'field', e.target.value)}
                    className="flex-1"
                  />
                  <Select value={c.op} onValueChange={(v) => updateCondition(i, 'op', v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="value"
                    value={c.value}
                    onChange={(e) => updateCondition(i, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(i)}
                    disabled={conditions.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="mr-1 size-3.5" />
                Add condition
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Field Mapping</Label>
            <p className="text-muted-foreground text-xs">Display field (key) → Payload path (value). Use dot notation for nested: data.deal.name</p>
            <div className="space-y-2">
              {fieldMapping.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="deal_name, amount, company_name..."
                    value={row.key}
                    onChange={(e) => updateFieldMapping(i, 'key', e.target.value)}
                    className="flex-1"
                  />
                  <span className="py-2 text-muted-foreground">←</span>
                  <Input
                    placeholder="dealname, montant_sub_accepte..."
                    value={row.value}
                    onChange={(e) => updateFieldMapping(i, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFieldMapping(i)}
                    disabled={fieldMapping.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFieldMapping}>
                <Plus className="mr-1 size-3.5" />
                Add mapping
              </Button>
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
