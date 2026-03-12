'use client'

import * as React from 'react'
import { Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { PropertySelector } from './property-selector'
import { useIntegrationSchema } from '@/lib/hooks/useIntegrationSchema'
import type { PropertyForDropdown } from '@/lib/hooks/useIntegrationSchema'
import { cn } from '@/lib/utils'

export interface TemplateTextEditorProps {
  value: string
  onChange: (value: string) => void
  integrationId: string | null
  objectType?: 'deals' | 'contacts' | 'companies'
  availableFields?: PropertyForDropdown[]
  placeholder?: string
  className?: string
}

const COMMON_FIELDS = [
  'dealname',
  'amount',
  'hubspot_owner_id',
  'associatedcompanyname',
  'account_manager',
]

// Map internal property names to display field names for {{}} syntax
const INTERNAL_TO_DISPLAY: Record<string, string> = {
  dealname: 'deal_name',
  hubspot_owner_id: 'owner_name',
  associatedcompanyname: 'company_name',
  amount: 'amount',
  account_manager: 'account_manager',
}

export function TemplateTextEditor({
  value,
  onChange,
  integrationId,
  objectType = 'deals',
  availableFields = [],
  placeholder = 'Type text and insert fields...',
  className,
}: TemplateTextEditorProps) {
  const [open, setOpen] = React.useState(false)
  const { properties } = useIntegrationSchema({ integrationId, objectType })
  const fields = availableFields.length > 0 ? availableFields : properties

  const handleQuickInsert = (name: string) => {
    const prop = fields.find((p) => p.name === name)
    if (prop) handleInsertAtCursor(prop)
  }

  const quickInsertProps = COMMON_FIELDS.map((name) =>
    fields.find((p) => p.name === name)
  ).filter(Boolean) as PropertyForDropdown[]

  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleInsertAtCursor = (prop: PropertyForDropdown) => {
    const el = inputRef.current
    const displayName = INTERNAL_TO_DISPLAY[prop.name] ?? prop.name
    const insert = `{{${displayName}}}`
    if (el) {
      const start = el.selectionStart ?? value.length
      const end = el.selectionEnd ?? value.length
      const before = value.slice(0, start)
      const after = value.slice(end)
      onChange(before + insert + after)
      setOpen(false)
      requestAnimationFrame(() => {
        el.focus()
        const pos = start + insert.length
        el.setSelectionRange(pos, pos)
      })
    } else {
      onChange(value + insert)
      setOpen(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="shrink-0">
              <Paperclip className="mr-1 size-4" />
              Insert Field
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="end">
            <PropertySelector
              integrationId={integrationId}
              objectType={objectType}
              value={null}
              onSelect={handleInsertAtCursor}
              inline
            />
          </PopoverContent>
        </Popover>
      </div>
      {quickInsertProps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-muted-foreground text-xs">Quick insert:</span>
          {quickInsertProps.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleQuickInsert(p.name)}
              className="rounded-md border border-dashed px-2 py-0.5 text-xs hover:bg-muted"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
