'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCelebrationWizardStore } from '@/stores/celebration-wizard'
import { WizardLayout } from '@/components/admin/celebration-wizard/wizard-layout'
import { StepTrigger } from '@/components/admin/celebration-wizard/step-trigger'
import { StepDesign } from '@/components/admin/celebration-wizard/step-design'
import { StepPreview } from '@/components/admin/celebration-wizard/step-preview'
import type { StarterTemplate } from '@/stores/celebration-wizard'

export function NewCelebrationContent() {
  const searchParams = useSearchParams()
  const currentStep = useCelebrationWizardStore((s) => s.currentStep)
  const reset = useCelebrationWizardStore((s) => s.reset)
  const applyStarterTemplate = useCelebrationWizardStore((s) => s.applyStarterTemplate)

  useEffect(() => {
    const starter = searchParams.get('starter') as StarterTemplate | null
    const duplicate = searchParams.get('duplicate')
    if (starter && ['deal_won', 'new_client', 'big_deal', 'start_blank'].includes(starter)) {
      reset()
      applyStarterTemplate(starter)
    } else if (!duplicate) {
      reset()
    }
  }, [searchParams, reset, applyStarterTemplate])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold">Create Celebration</h1>
      <p className="mb-8 text-muted-foreground">
        Set up when and how celebrations appear on your display.
      </p>

      <WizardLayout>
        {currentStep === 1 && <StepTrigger />}
        {currentStep === 2 && <StepDesign />}
        {currentStep === 3 && <StepPreview />}
      </WizardLayout>
    </div>
  )
}
