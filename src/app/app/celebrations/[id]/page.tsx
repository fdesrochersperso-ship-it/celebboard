'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-clients'
import { useOrg } from '@/lib/hooks/use-org'
import { useCelebrationWizardStore } from '@/stores/celebration-wizard'
import { WizardLayout } from '@/components/admin/celebration-wizard/wizard-layout'
import { StepTrigger } from '@/components/admin/celebration-wizard/step-trigger'
import { StepDesign } from '@/components/admin/celebration-wizard/step-design'
import { StepPreview } from '@/components/admin/celebration-wizard/step-preview'
import { toast } from 'sonner'

export default function EditCelebrationPage() {
  const params = useParams()
  const router = useRouter()
  const { orgId, loading: orgLoading } = useOrg()
  const hydrateFromTemplate = useCelebrationWizardStore((s) => s.hydrateFromTemplate)
  const reset = useCelebrationWizardStore((s) => s.reset)
  const currentStep = useCelebrationWizardStore((s) => s.currentStep)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const id = typeof params.id === 'string' ? params.id : null

  useEffect(() => {
    if (!id || !orgId) {
      if (!orgLoading && (!id || !orgId)) {
        setLoading(false)
        if (id && !orgId) {
          setError('No organization')
        }
      }
      return
    }

    async function load() {
      const supabase = createClient()
      const { data: template, error: templateError } = await supabase
        .from('celebration_templates')
        .select(
          'id, name, title_pattern, subtitle_pattern, visual_style, sound, duration_seconds, show_counter, counter_label, counter_source, show_photos, photo_fields, is_active'
        )
        .eq('id', id)
        .eq('org_id', orgId)
        .single()

      if (templateError || !template) {
        setError('Template not found')
        setLoading(false)
        toast.error('Celebration not found')
        router.push('/app/celebrations')
        return
      }

      const { data: trigger, error: triggerError } = await supabase
        .from('celebration_triggers')
        .select('id, integration_id, event_type, conditions, field_mapping')
        .eq('template_id', id)
        .eq('org_id', orgId)
        .limit(1)
        .maybeSingle()

      if (triggerError) {
        setError('Failed to load trigger')
        setLoading(false)
        return
      }

      if (!trigger) {
        setError('No trigger found for this template')
        setLoading(false)
        return
      }

      reset()
      hydrateFromTemplate(
        {
          template: {
            id: template.id,
            name: template.name,
            title_pattern: template.title_pattern,
            subtitle_pattern: template.subtitle_pattern,
            visual_style: template.visual_style,
            sound: template.sound,
            duration_seconds: template.duration_seconds,
            show_counter: template.show_counter,
            counter_label: template.counter_label,
            counter_source: template.counter_source,
            show_photos: template.show_photos,
            photo_fields: (template.photo_fields as string[]) ?? [],
            is_active: template.is_active,
          },
          trigger: {
            id: trigger.id,
            integration_id: trigger.integration_id,
            event_type: trigger.event_type,
            conditions: (trigger.conditions as typeof trigger.conditions) ?? [],
            field_mapping: (trigger.field_mapping as Record<string, string>) ?? {},
          },
        },
        { appendCopy: false }
      )
      setLoading(false)
    }

    load()
  }, [id, orgId, orgLoading, hydrateFromTemplate, reset, router])

  if (orgLoading || loading) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Edit Celebration</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold">Edit Celebration</h1>
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Edit Celebration</h1>
      <p className="mb-8 text-muted-foreground">
        Update when and how this celebration appears on your display.
      </p>

      <WizardLayout>
        {currentStep === 1 && <StepTrigger />}
        {currentStep === 2 && <StepDesign />}
        {currentStep === 3 && <StepPreview />}
      </WizardLayout>
    </div>
  )
}
