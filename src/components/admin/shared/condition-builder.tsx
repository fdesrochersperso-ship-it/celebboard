'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConditionRow, type Condition } from './condition-row'

export interface ConditionBuilderProps {
  conditions: Condition[]
  integrationId: string | null
  objectType: 'deals' | 'contacts' | 'companies'
  onChange: (conditions: Condition[]) => void
  /** Custom message when no conditions (default: celebrations-focused) */
  emptyMessage?: string
}

const EMPTY_CONDITION: Condition = {
  field: '',
  operator: 'equals',
  value: '',
  property_type: 'string',
}

export function ConditionBuilder({
  conditions,
  integrationId,
  objectType,
  onChange,
  emptyMessage = 'No conditions yet. Add one to define when celebrations should fire.',
}: ConditionBuilderProps) {
  const handleUpdate = (index: number, condition: Condition) => {
    const next = [...conditions]
    next[index] = condition
    onChange(next)
  }

  const handleRemove = (index: number) => {
    const next = conditions.filter((_, i) => i !== index)
    // Always keep at least one blank row (spec: "start with one blank row to invite interaction")
    onChange(next.length > 0 ? next : [{ ...EMPTY_CONDITION }])
  }

  const handleAdd = () => {
    onChange([...conditions, { ...EMPTY_CONDITION }])
  }

  return (
    <div className="space-y-4">
      {conditions.length === 0 ? (
        <div className="rounded-md border border-dashed p-4">
          <p className="text-muted-foreground mb-3 text-sm">{emptyMessage}</p>
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Add condition
          </Button>
        </div>
      ) : (
        <>
          {conditions.map((condition, index) => (
            <div key={index} className="space-y-2">
              {index > 0 && (
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                    AND
                  </span>
                </div>
              )}
              <ConditionRow
                condition={condition}
                integrationId={integrationId}
                objectType={objectType}
                onChange={(c) => handleUpdate(index, c)}
                onRemove={() => handleRemove(index)}
              />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            Add condition
          </Button>
        </>
      )}
    </div>
  )
}
