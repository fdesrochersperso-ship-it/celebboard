'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CelebrationPreview } from './celebration-preview'
import { useCelebrationWizardStore } from '@/stores/celebration-wizard'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { conditionsToText } from '@/lib/celebrations/conditions-to-text'

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

export function StepPreview() {
  const router = useRouter()
  const step1 = useCelebrationWizardStore((s) => s.step1)
  const step2 = useCelebrationWizardStore((s) => s.step2)
  const updateStep2 = useCelebrationWizardStore((s) => s.updateStep2)
  const setStep = useCelebrationWizardStore((s) => s.setStep)
  const toPayload = useCelebrationWizardStore((s) => s.toPayload)
  const editingTemplateId = useCelebrationWizardStore((s) => s.editingTemplateId)
  const initialIsActive = useCelebrationWizardStore((s) => s.initialIsActive)

  const [showDataForm, setShowDataForm] = React.useState(false)
  const [sampleData, setSampleData] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState('')
  const [isActive, setIsActive] = React.useState(
    initialIsActive !== null ? initialIsActive : true
  )

  const conditions = step1.conditions.filter((c) => c.field && c.operator)
  const hasData = !!(
    step1.integrationId ||
    step2.name ||
    step2.titlePattern ||
    conditions.length > 0
  )

  const handleSave = async (active: boolean) => {
    setError('')
    setSaving(true)
    try {
      const payload = toPayload(active)
      const isEdit = !!editingTemplateId
      const url = isEdit
        ? `/api/celebrations/${editingTemplateId}`
        : '/api/celebrations'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? `Save failed: ${res.status}`)
      }
      toast.success(isEdit ? 'Celebration updated' : 'Celebration created')
      router.push('/app/celebrations')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (hasData && !confirm('Discard unsaved changes and return to celebrations?')) {
      return
    }
    router.push('/app/celebrations')
  }

  return (
    <div className="space-y-8">
      {/* Section A: TV Preview */}
      <section className="flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <CelebrationPreview
            titlePattern={step2.titlePattern}
            subtitlePattern={step2.subtitlePattern}
            visualStyle={step2.visualStyle}
            sound={step2.sound}
            durationSeconds={step2.durationSeconds}
            showPhotos={step2.showPhotos}
            photoFields={step2.photoFields}
            showCounter={step2.showCounter}
            counterLabel={step2.counterLabel}
            fieldMapping={step2.fieldMapping}
            sampleDataOverride={Object.keys(sampleData).length > 0 ? sampleData : undefined}
            showDataForm={showDataForm}
            onSampleDataChange={setSampleData}
          />
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDataForm(!showDataForm)}
          >
            {showDataForm ? (
              <ChevronDown className="mr-1.5 size-4" />
            ) : (
              <ChevronRight className="mr-1.5 size-4" />
            )}
            Try with different data
          </Button>
        </div>
      </section>

      {/* Section B: Summary card */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-lg font-medium">Summary</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Trigger Conditions
              </h3>
              {conditions.length > 0 ? (
                <p className="text-sm">
                  {conditionsToText(conditions)}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">No conditions</p>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                Celebration
              </h3>
              <p className="text-sm">
                {step2.name || 'New Celebration'} —{' '}
                {VISUAL_LABELS[step2.visualStyle] ?? step2.visualStyle} ·{' '}
                {SOUND_LABELS[step2.sound] ?? step2.sound} · {step2.durationSeconds}s
                {step2.showPhotos && ' · Photos'}
                {step2.showCounter && (
                  <> · Counter: {step2.counterLabel || 'Amount'}</>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section C: Active toggle */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label htmlFor="is-active">Active</Label>
          <p className="text-muted-foreground text-sm">
            Celebration will fire when conditions match
          </p>
        </div>
        <Switch
          id="is-active"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      {/* Section D: Actions */}
      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(2)}>
            ← Back
          </Button>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={saving}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave(isActive)}
            disabled={saving}
          >
            Save & {isActive ? 'Activate' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}
