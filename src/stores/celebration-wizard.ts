'use client'

import { create } from 'zustand'
import type { Condition } from '@/components/admin/shared/condition-row'

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type StarterTemplate =
  | 'deal_won'
  | 'new_client'
  | 'big_deal'
  | 'start_blank'

export interface Step1Data {
  integrationId: string | null
  objectType: 'deals' | 'contacts' | 'companies'
  eventType: string | null
  conditions: Condition[]
}

export interface Step2Data {
  name: string
  titlePattern: string
  subtitlePattern: string
  visualStyle: string
  sound: string
  durationSeconds: number
  showPhotos: boolean
  photoFields: string[]
  showCounter: boolean
  counterLabel: string
  counterSource: string | null
  fieldMapping: Record<string, string>
}

export interface CreateCelebrationPayload {
  name: string
  title_pattern: string
  subtitle_pattern: string
  visual_style: string
  sound: string
  duration_seconds: number
  show_counter: boolean
  counter_label?: string
  counter_source?: string
  show_photos: boolean
  photo_fields: string[]
  integration_id: string
  event_type?: string
  conditions: Array<{
    field: string
    operator: string
    value: unknown
    property_type?: string
    property_label?: string
  }>
  field_mapping: Record<string, string>
  is_active: boolean
}

// -----------------------------------------------------------------------------
// Defaults
// -----------------------------------------------------------------------------

const EMPTY_CONDITION: Condition = {
  field: '',
  operator: 'equals',
  value: '',
  property_type: 'string',
}

const DEFAULT_STEP1: Step1Data = {
  integrationId: null,
  objectType: 'deals',
  eventType: null,
  conditions: [{ ...EMPTY_CONDITION }],
}

const DEFAULT_STEP2: Step2Data = {
  name: '',
  titlePattern: '',
  subtitlePattern: '',
  visualStyle: 'confetti',
  sound: 'victory',
  durationSeconds: 20,
  showPhotos: true,
  photoFields: ['hubspot_owner_id'],
  showCounter: false,
  counterLabel: '',
  counterSource: null,
  fieldMapping: {},
}

// HubSpot conventional values for starter templates
const DEALSTAGE_CLOSED_WON = 'closedwon'
const AMOUNT_FIELD = 'amount'

// -----------------------------------------------------------------------------
// Store
// -----------------------------------------------------------------------------

export interface TemplateWithTrigger {
  template: {
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
  }
  trigger: {
    id: string
    integration_id: string
    event_type: string | null
    conditions: Array<{
      field: string
      operator?: string
      op?: string
      value: unknown
      property_type?: string
      property_label?: string
    }>
    field_mapping: Record<string, string>
  }
}

interface CelebrationWizardState {
  currentStep: 1 | 2 | 3
  step1: Step1Data
  step2: Step2Data
  editingTemplateId: string | null
  initialIsActive: boolean | null

  setStep: (step: 1 | 2 | 3) => void
  updateStep1: (data: Partial<Step1Data>) => void
  updateStep2: (data: Partial<Step2Data>) => void
  applyStarterTemplate: (template: StarterTemplate) => void
  hydrateFromTemplate: (data: TemplateWithTrigger, options?: { appendCopy?: boolean }) => void
  reset: () => void
  toPayload: (isActive?: boolean) => CreateCelebrationPayload
}

export const useCelebrationWizardStore = create<CelebrationWizardState>((set, get) => ({
  currentStep: 1,
  step1: { ...DEFAULT_STEP1 },
  step2: { ...DEFAULT_STEP2 },
  editingTemplateId: null,
  initialIsActive: null,

  setStep: (step) => set({ currentStep: step }),

  updateStep1: (data) =>
    set((state) => ({
      step1: { ...state.step1, ...data },
    })),

  updateStep2: (data) =>
    set((state) => ({
      step2: { ...state.step2, ...data },
    })),

  hydrateFromTemplate: (data, options) => {
    const { template, trigger } = data
    const conditions: Condition[] =
      Array.isArray(trigger.conditions) && trigger.conditions.length > 0
        ? trigger.conditions.map((c) => ({
            field: c.field,
            operator: c.operator ?? c.op ?? 'equals',
            value: c.value,
            property_type: (c.property_type ?? 'string') as Condition['property_type'],
            property_label: c.property_label,
          }))
        : [{ ...EMPTY_CONDITION }]
    const name = options?.appendCopy ? `${template.name} (copy)` : template.name
    set({
      currentStep: 1,
      editingTemplateId: options?.appendCopy ? null : template.id,
      initialIsActive: options?.appendCopy ? null : template.is_active,
      step1: {
        ...get().step1,
        integrationId: trigger.integration_id,
        objectType: 'deals',
        eventType: trigger.event_type ?? null,
        conditions,
      },
      step2: {
        ...get().step2,
        name,
        titlePattern: template.title_pattern,
        subtitlePattern: template.subtitle_pattern ?? '',
        visualStyle: template.visual_style,
        sound: template.sound,
        durationSeconds: template.duration_seconds,
        showPhotos: template.show_photos,
        photoFields: template.photo_fields ?? [],
        showCounter: template.show_counter,
        counterLabel: template.counter_label ?? '',
        counterSource: template.counter_source ?? null,
        fieldMapping: trigger.field_mapping ?? {},
      },
    })
  },

  applyStarterTemplate: (template) => {
    const step2Defaults: Partial<Step2Data> = {
      titlePattern: '🎉 DEAL WON!',
      subtitlePattern: '{{owner_name}} closed {{deal_name}} — ${{amount}}',
      visualStyle: 'confetti',
      sound: 'victory',
    }

    switch (template) {
      case 'deal_won':
        set({
          step1: {
            ...get().step1,
            conditions: [
              {
                field: 'dealstage',
                operator: 'is_any_of',
                value: [DEALSTAGE_CLOSED_WON],
                property_type: 'enumeration',
                property_label: 'Deal Stage',
              },
              {
                field: AMOUNT_FIELD,
                operator: 'gt',
                value: 0,
                property_type: 'number',
                property_label: 'Amount',
              },
            ],
          },
          step2: { ...get().step2, ...step2Defaults, name: 'Deal Won' },
        })
        break
      case 'new_client':
        set({
          step1: {
            ...get().step1,
            conditions: [
              {
                field: 'dealstage',
                operator: 'is_any_of',
                value: [DEALSTAGE_CLOSED_WON],
                property_type: 'enumeration',
                property_label: 'Deal Stage',
              },
            ],
          },
          step2: { ...get().step2, ...step2Defaults, name: 'New Client' },
        })
        break
      case 'big_deal':
        set({
          step1: {
            ...get().step1,
            conditions: [
              {
                field: 'dealstage',
                operator: 'is_any_of',
                value: [DEALSTAGE_CLOSED_WON],
                property_type: 'enumeration',
                property_label: 'Deal Stage',
              },
              {
                field: AMOUNT_FIELD,
                operator: 'gt',
                value: 10000,
                property_type: 'number',
                property_label: 'Amount',
              },
            ],
          },
          step2: { ...get().step2, ...step2Defaults, name: 'Big Deal' },
        })
        break
      case 'start_blank':
        set({
          step1: {
            ...get().step1,
            conditions: [{ ...EMPTY_CONDITION }],
          },
          step2: { ...get().step2 },
        })
        break
    }
  },

  reset: () =>
    set({
      currentStep: 1,
      step1: { ...DEFAULT_STEP1 },
      step2: { ...DEFAULT_STEP2 },
      editingTemplateId: null,
      initialIsActive: null,
    }),

  toPayload: (isActive = true) => {
    const { step1, step2 } = get()
    return {
      name: step2.name || 'New Celebration',
      title_pattern: step2.titlePattern,
      subtitle_pattern: step2.subtitlePattern,
      visual_style: step2.visualStyle,
      sound: step2.sound,
      duration_seconds: step2.durationSeconds,
      show_counter: step2.showCounter,
      counter_label: step2.counterLabel || undefined,
      counter_source: step2.counterSource || undefined,
      show_photos: step2.showPhotos,
      photo_fields: step2.photoFields,
      integration_id: step1.integrationId!,
      event_type: step1.eventType || undefined,
      conditions: step1.conditions
        .filter((c) => c.field && c.operator)
        .map((c) => ({
          field: c.field,
          operator: c.operator,
          value: c.value,
          property_type: c.property_type,
          property_label: c.property_label,
        })),
      field_mapping: step2.fieldMapping,
      is_active: isActive,
    }
  },
}))
