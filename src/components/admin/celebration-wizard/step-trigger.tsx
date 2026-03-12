'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { ChevronDown, ChevronRight } from 'lucide-react'
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
import { ConditionBuilder } from '@/components/admin/shared/condition-builder'
import { useCelebrationWizardStore } from '@/stores/celebration-wizard'
import type { StarterTemplate } from '@/stores/celebration-wizard'
import type { Condition } from '@/components/admin/shared/condition-row'
import { cn } from '@/lib/utils'

type Integration = { id: string; name: string; type: string }

const OBJECT_TYPES = [
  { value: 'deals', label: 'Deals' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'companies', label: 'Companies' },
] as const

const STARTER_TEMPLATES: Array<{
  id: StarterTemplate
  emoji: string
  label: string
  description: string
}> = [
  {
    id: 'deal_won',
    emoji: '🎉',
    label: 'Deal Won',
    description: 'Stage = Closed Won + Amount > 0',
  },
  {
    id: 'new_client',
    emoji: '🤝',
    label: 'New Client',
    description: 'Stage = Closed Won',
  },
  {
    id: 'big_deal',
    emoji: '💎',
    label: 'Big Deal',
    description: 'Stage = Closed Won + Amount > 10000',
  },
  {
    id: 'start_blank',
    emoji: '✏️',
    label: 'Start blank',
    description: '',
  },
]

function isConditionComplete(c: Condition): boolean {
  if (!c.field || !c.operator) return false
  const noValueOps = new Set(['is_known', 'is_unknown', 'is_true', 'is_false'])
  if (noValueOps.has(c.operator)) return true
  if (c.operator === 'between') {
    const arr = Array.isArray(c.value) ? c.value : []
    return arr.length >= 2 && arr[0] != null && arr[1] != null
  }
  if (c.operator === 'within_last') {
    const v = c.value as { value?: number; unit?: string } | undefined
    return typeof v?.value === 'number' && v.value > 0 && !!v?.unit
  }
  if (c.property_type === 'enumeration' && (c.operator === 'is_any_of' || c.operator === 'is_none_of')) {
    return Array.isArray(c.value) && c.value.length > 0
  }
  return c.value !== '' && c.value !== undefined && c.value !== null
}

export function StepTrigger() {
  const { orgId } = useOrg()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const step1 = useCelebrationWizardStore((s) => s.step1)
  const updateStep1 = useCelebrationWizardStore((s) => s.updateStep1)
  const setStep = useCelebrationWizardStore((s) => s.setStep)
  const applyStarterTemplate = useCelebrationWizardStore((s) => s.applyStarterTemplate)

  useEffect(() => {
    if (orgId) {
      const supabase = createClient()
      supabase
        .from('integrations')
        .select('id, name, type')
        .eq('org_id', orgId)
        .eq('status', 'active')
        .then(({ data }) => {
          const list = (data as unknown as Integration[]) ?? []
          setIntegrations(list)
          if (list.length === 1 && !step1.integrationId) {
            updateStep1({ integrationId: list[0]!.id })
          }
        })
    }
  }, [orgId, updateStep1])

  const hasCompleteCondition = step1.conditions.some(isConditionComplete)
  const canProceed = !!step1.integrationId && hasCompleteCondition

  const handleConditionsChange = (conditions: Condition[]) => {
    updateStep1({ conditions })
  }

  const handleNext = () => {
    if (canProceed) setStep(2)
  }

  return (
    <div className="space-y-8">
      {/* Section A: Source */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Source</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="integration">Integration</Label>
            <Select
              value={step1.integrationId ?? ''}
              onValueChange={(v) => updateStep1({ integrationId: v || null })}
            >
              <SelectTrigger id="integration">
                <SelectValue placeholder="Select integration..." />
              </SelectTrigger>
              <SelectContent>
                {integrations.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name || i.type} ({i.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="objectType">Object type</Label>
            <Select
              value={step1.objectType}
              onValueChange={(v) =>
                updateStep1({ objectType: v as 'deals' | 'contacts' | 'companies' })
              }
            >
              <SelectTrigger id="objectType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBJECT_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Section B: Conditions */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Celebrate when all of these are true:</h2>
        <ConditionBuilder
          conditions={step1.conditions}
          integrationId={step1.integrationId}
          objectType={step1.objectType}
          onChange={handleConditionsChange}
        />
      </section>

      {/* Section C: Starter Templates */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Starter Templates</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STARTER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyStarterTemplate(t.id)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors',
                'hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className="font-medium">{t.label}</span>
              {t.description && (
                <span className="text-muted-foreground text-xs">{t.description}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Section D: Advanced - Event type */}
      <section>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {showAdvanced ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
          Advanced: filter by event type
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-2">
            <Input
              placeholder="e.g. deal.propertyChange, deal.creation"
              value={step1.eventType ?? ''}
              onChange={(e) => updateStep1({ eventType: e.target.value || null })}
              className="max-w-md"
            />
          </div>
        )}
      </section>

      {/* Section E: Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <a
          href="/app/celebrations"
          className="text-muted-foreground text-sm hover:text-foreground"
        >
          Cancel
        </a>
        <Button onClick={handleNext} disabled={!canProceed}>
          Next: Design your celebration →
        </Button>
      </div>
    </div>
  )
}
