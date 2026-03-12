'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCelebrationWizardStore } from '@/stores/celebration-wizard'

const STEPS = [
  { num: 1, label: 'When to celebrate' },
  { num: 2, label: 'Design' },
  { num: 3, label: 'Preview & Save' },
] as const

export function WizardLayout({ children }: { children: React.ReactNode }) {
  const currentStep = useCelebrationWizardStore((s) => s.currentStep)
  const setStep = useCelebrationWizardStore((s) => s.setStep)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.num
          const isCurrent = currentStep === step.num
          const isClickable = isCompleted

          return (
            <div key={step.num} className="flex items-center gap-2">
              {index > 0 && (
                <div
                  className={cn(
                    'h-px w-8',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => isClickable && setStep(step.num as 1 | 2 | 3)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                  isCurrent && 'bg-primary/10 font-medium text-primary',
                  isCompleted && 'text-muted-foreground hover:text-foreground',
                  !isCurrent && !isCompleted && 'text-muted-foreground',
                  isClickable && 'cursor-pointer',
                  !isClickable && !isCurrent && 'cursor-default'
                )}
              >
                <span
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full text-xs',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="size-3.5" /> : step.num}
                </span>
                {step.label}
              </button>
            </div>
          )
        })}
      </div>

      <div>{children}</div>
    </div>
  )
}
