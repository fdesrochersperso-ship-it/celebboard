'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TemplateTextEditor } from '@/components/admin/shared/template-text-editor'
import { VisualStylePicker } from '@/components/admin/shared/visual-style-picker'
import { SoundPicker } from '@/components/admin/shared/sound-picker'
import { FieldMappingTable } from '@/components/admin/shared/field-mapping-table'
import { useIntegrationSchema } from '@/lib/hooks/useIntegrationSchema'
import type { PropertyForDropdown } from '@/lib/hooks/useIntegrationSchema'
import { useCelebrationWizardStore } from '@/stores/celebration-wizard'

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const FIELD_REF_REGEX = /\{\{([^}]+)\}\}/g

function extractFieldReferences(text: string): string[] {
  const matches = text.matchAll(FIELD_REF_REGEX)
  return [...new Set([...matches].map((m) => m[1]!.trim()))].filter(Boolean)
}

const KNOWN_ALIASES: Record<string, string> = {
  deal_name: 'dealname',
  dealname: 'dealname',
  amount: 'amount',
  company_name: 'associatedcompanyname',
  owner_name: 'hubspot_owner_id',
}

function similarity(a: string, b: string): number {
  const sa = a.toLowerCase().replace(/[_\s]+/g, '')
  const sb = b.toLowerCase().replace(/[_\s]+/g, '')
  if (sa === sb) return 1
  if (sa.includes(sb) || sb.includes(sa)) return 0.8
  const setA = new Set(sa.split(''))
  const setB = new Set(sb.split(''))
  let matches = 0
  for (const c of setA) {
    if (setB.has(c)) matches++
  }
  return matches / Math.max(setA.size, setB.size)
}

function suggestMapping(
  displayField: string,
  properties: PropertyForDropdown[]
): string | null {
  const alias = KNOWN_ALIASES[displayField]
  if (alias && properties.some((p) => p.name === alias)) return alias
  const scores = properties.map((p) => ({
    name: p.name,
    score: Math.max(
      similarity(displayField, p.name),
      similarity(displayField, p.label)
    ),
  }))
  scores.sort((a, b) => b.score - a.score)
  return scores[0]?.score > 0.5 ? scores[0]!.name : null
}

function generateNameFromConditions(
  conditions: Array<{ field: string; operator: string; value: unknown; property_label?: string }>
): string {
  const parts: string[] = []
  let stageLabel: string | null = null
  let amountThreshold: number | null = null

  for (const c of conditions) {
    if (!c.field || !c.operator) continue
    if (c.field === 'dealstage' && c.operator === 'is_any_of') {
      const vals = Array.isArray(c.value) ? c.value : [c.value]
      if (vals.length === 1 && vals[0] === 'closedwon') {
        stageLabel = 'Closed Won'
      } else if (vals.length > 0) {
        stageLabel = c.property_label ?? String(vals[0])
      }
    }
    if (c.field === 'amount' && (c.operator === 'gt' || c.operator === 'gte')) {
      const v = c.value
      if (typeof v === 'number' && v > 0) amountThreshold = v
      if (typeof v === 'string' && /^\d+$/.test(v)) amountThreshold = parseInt(v, 10)
    }
  }

  if (stageLabel) parts.push(stageLabel)
  if (amountThreshold != null && amountThreshold > 0) {
    if (amountThreshold >= 10000) parts.push(`> $${amountThreshold.toLocaleString()}`)
    else parts.push(`> $${amountThreshold}`)
  }
  if (parts.length === 0) return 'New Celebration'
  return parts.join(' · ')
}

const TITLE_PRESETS = [
  { label: '🎉 DEAL WON!', value: '🎉 DEAL WON!' },
  { label: '🤝 NEW CLIENT!', value: '🤝 NEW CLIENT!' },
  { label: '⭐ SUBSCRIBER!', value: '⭐ NEW SUBSCRIBER!' },
  { label: '🏆 MILESTONE!', value: '🏆 MILESTONE!' },
]

const COUNTER_SOURCES = [
  { value: 'amount_field', label: "Sum from this celebration's amount field" },
  { value: 'kpi', label: 'Link to KPI (coming soon)' },
]

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function StepDesign() {
  const step1 = useCelebrationWizardStore((s) => s.step1)
  const step2 = useCelebrationWizardStore((s) => s.step2)
  const updateStep2 = useCelebrationWizardStore((s) => s.updateStep2)
  const setStep = useCelebrationWizardStore((s) => s.setStep)

  const [customFields, setCustomFields] = React.useState<string[]>([])
  const hasInitializedName = React.useRef(false)

  const { properties } = useIntegrationSchema({
    integrationId: step1.integrationId,
    objectType: step1.objectType,
  })

  // Owner-related properties for "Match team member by"
  const ownerProperties = React.useMemo(() => {
    return properties.filter(
      (p) =>
        p.name === 'hubspot_owner_id' ||
        /owner|manager|contact/i.test(p.name) ||
        /owner|manager|contact/i.test(p.label)
    )
  }, [properties])

  // Auto-generate name from conditions on first entry to Step 2
  React.useEffect(() => {
    if (hasInitializedName.current) return
    if (step2.name) return // Already set by starter template
    const generated = generateNameFromConditions(step1.conditions)
    if (generated && generated !== 'New Celebration') {
      hasInitializedName.current = true
      updateStep2({ name: generated })
    }
  }, [step1.conditions, step2.name, updateStep2])

  // Extract field references and auto-map when patterns change
  const displayFieldsFromPatterns = React.useMemo(() => {
    const fromTitle = extractFieldReferences(step2.titlePattern)
    const fromSubtitle = extractFieldReferences(step2.subtitlePattern)
    return [...new Set([...fromTitle, ...fromSubtitle])]
  }, [step2.titlePattern, step2.subtitlePattern])

  const allDisplayFields = React.useMemo(
    () => [...new Set([...displayFieldsFromPatterns, ...customFields])].sort(),
    [displayFieldsFromPatterns, customFields]
  )

  // Auto-map new fields when patterns change
  React.useEffect(() => {
    const updates: Record<string, string> = { ...step2.fieldMapping }
    let changed = false
    for (const df of allDisplayFields) {
      if (updates[df]) continue
      const suggested = suggestMapping(df, properties)
      if (suggested) {
        updates[df] = suggested
        changed = true
      }
    }
    if (changed) updateStep2({ fieldMapping: updates })
  }, [allDisplayFields.join(','), properties.length, step2.fieldMapping, updateStep2])

  const handleAddCustomField = (fieldName: string) => {
    if (fieldName && !customFields.includes(fieldName)) {
      setCustomFields((prev) => [...prev, fieldName].sort())
    }
  }

  return (
    <div className="space-y-8">
      {/* Section A: Celebration Name */}
      <section className="space-y-2">
        <Label htmlFor="celebration-name">Celebration Name</Label>
        <Input
          id="celebration-name"
          placeholder="e.g. Deal Won, Big Deal"
          value={step2.name}
          onChange={(e) => updateStep2({ name: e.target.value })}
          className="max-w-md"
        />
      </section>

      {/* Section B: Display Text */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Display Text</h2>
        <div className="flex flex-wrap gap-2">
          {TITLE_PRESETS.map((p) => (
            <Button
              key={p.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateStep2({ titlePattern: p.value })}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <div className="space-y-2">
          <Label>Title Pattern</Label>
          <TemplateTextEditor
            value={step2.titlePattern}
            onChange={(v) => updateStep2({ titlePattern: v })}
            integrationId={step1.integrationId}
            objectType={step1.objectType}
            placeholder="e.g. 🎉 DEAL WON: {{company_name}}"
          />
        </div>
        <div className="space-y-2">
          <Label>Subtitle Pattern</Label>
          <TemplateTextEditor
            value={step2.subtitlePattern}
            onChange={(v) => updateStep2({ subtitlePattern: v })}
            integrationId={step1.integrationId}
            objectType={step1.objectType}
            placeholder="e.g. {{owner_name}} closed {{deal_name}}"
          />
        </div>
      </section>

      {/* Section C: Visual Style */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Visual Style</h2>
        <VisualStylePicker
          value={step2.visualStyle as 'confetti' | 'fireworks' | 'champagne'}
          onChange={(v) => updateStep2({ visualStyle: v })}
        />
      </section>

      {/* Section D: Sound */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Sound</h2>
        <SoundPicker
          value={step2.sound as 'victory' | 'cash_register' | 'bell' | 'applause' | 'drumroll' | 'none'}
          onChange={(v) => updateStep2({ sound: v })}
        />
      </section>

      {/* Section E: Duration & Options */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Duration & Options</h2>
        <div className="space-y-2">
          <Label>Duration: {step2.durationSeconds} seconds</Label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={10}
              max={60}
              value={step2.durationSeconds}
              onChange={(e) =>
                updateStep2({ durationSeconds: parseInt(e.target.value, 10) })
              }
              className="h-2 w-48 cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            />
            <Input
              type="number"
              min={10}
              max={60}
              value={step2.durationSeconds}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v)) updateStep2({ durationSeconds: Math.min(60, Math.max(10, v)) })
              }}
              className="w-20"
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="show-photos">Show team photos</Label>
            <p className="text-muted-foreground text-sm">Display team member photos when available</p>
          </div>
          <Switch
            id="show-photos"
            checked={step2.showPhotos}
            onCheckedChange={(v) => updateStep2({ showPhotos: v })}
          />
        </div>
        {step2.showPhotos && (
          <div className="ml-4 space-y-2">
            <Label>Match team member by</Label>
            <Select
              value={step2.photoFields[0] ?? 'hubspot_owner_id'}
              onValueChange={(v) => updateStep2({ photoFields: [v] })}
            >
              <SelectTrigger className="max-w-xs">
                <SelectValue placeholder="Select property..." />
              </SelectTrigger>
              <SelectContent>
                {ownerProperties.length > 0 ? (
                  ownerProperties.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.label} ({p.name})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="hubspot_owner_id">Deal Owner (hubspot_owner_id)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="show-counter">Show running counter</Label>
            <p className="text-muted-foreground text-sm">Display a live counter (e.g. revenue)</p>
          </div>
          <Switch
            id="show-counter"
            checked={step2.showCounter}
            onCheckedChange={(v) => updateStep2({ showCounter: v })}
          />
        </div>
        {step2.showCounter && (
          <div className="ml-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="counter-label">Counter label</Label>
              <Input
                id="counter-label"
                placeholder="e.g. Revenue This Quarter"
                value={step2.counterLabel}
                onChange={(e) => updateStep2({ counterLabel: e.target.value })}
                className="max-w-xs"
              />
            </div>
            <div className="space-y-2">
              <Label>Counter source</Label>
              <Select
                value={step2.counterSource ?? 'amount_field'}
                onValueChange={(v) => updateStep2({ counterSource: v })}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTER_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </section>

      {/* Section F: Field Mapping */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Field Mapping</h2>
        <p className="text-muted-foreground text-sm">
          Map display fields from your patterns to HubSpot properties.
        </p>
        <FieldMappingTable
          mappings={step2.fieldMapping}
          integrationId={step1.integrationId}
          objectType={step1.objectType}
          onChange={(m) => updateStep2({ fieldMapping: m })}
          displayFields={allDisplayFields}
          onAddCustomField={handleAddCustomField}
        />
      </section>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button variant="outline" onClick={() => setStep(1)}>
          ← Back
        </Button>
        <Button onClick={() => setStep(3)}>Next: Preview →</Button>
      </div>
    </div>
  )
}
