'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useIntegrationSchema } from '@/lib/hooks/useIntegrationSchema'
import type {
  PropertyForDropdown,
  PropertyType,
} from '@/lib/hooks/useIntegrationSchema'

const TYPE_ICONS: Record<string, string> = {
  string: '📝',
  number: '🔢',
  date: '📅',
  datetime: '📅',
  enumeration: '📋',
  bool: '✅',
}

function getTypeIcon(type: string): string {
  return TYPE_ICONS[type] ?? '📝'
}

function groupByGroupLabel(properties: PropertyForDropdown[]): Map<string, PropertyForDropdown[]> {
  const map = new Map<string, PropertyForDropdown[]>()
  for (const p of properties) {
    const key = p.groupLabel || 'Other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return map
}

export interface PropertySelectorProps {
  integrationId: string | null
  objectType?: 'deals' | 'contacts' | 'companies'
  value?: PropertyForDropdown | null
  onSelect: (property: PropertyForDropdown) => void
  placeholder?: string
  disabled?: boolean
  /** When true, renders only the command list (no trigger/popover). Use inside a Popover. */
  inline?: boolean
  /** Filter to only show properties of these types (e.g. ['number'] for aggregate fields) */
  propertyTypeFilter?: PropertyType[]
}

export function PropertySelector({
  integrationId,
  objectType = 'deals',
  value,
  onSelect,
  placeholder = 'Select property...',
  disabled = false,
  inline = false,
  propertyTypeFilter,
}: PropertySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const { properties, isLoading, error } = useIntegrationSchema({
    integrationId,
    objectType,
  })

  const filteredProperties = React.useMemo(() => {
    if (!propertyTypeFilter?.length) return properties
    const set = new Set(propertyTypeFilter)
    return properties.filter((p) => set.has(p.type))
  }, [properties, propertyTypeFilter])

  const groups = React.useMemo(
    () => groupByGroupLabel(filteredProperties),
    [filteredProperties]
  )

  const handleSelect = (prop: PropertyForDropdown) => {
    onSelect(prop)
    setOpen(false)
  }

  const commandContent = (
    <Command>
      <CommandInput placeholder="Search by label or name..." />
      <CommandList>
        <CommandEmpty>No property found.</CommandEmpty>
        {Array.from(groups.entries()).map(([groupLabel, props]) => (
          <CommandGroup key={groupLabel} heading={groupLabel}>
            {props.map((prop) => (
              <CommandItem
                key={prop.name}
                value={`${prop.label} ${prop.name}`}
                onSelect={() => handleSelect(prop)}
              >
                <Check
                  className={cn(
                    'mr-2 size-4',
                    value?.name === prop.name ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <span className="mr-2">{getTypeIcon(prop.type)}</span>
                <div className="flex flex-col">
                  <span>{prop.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {prop.name}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )

  if (inline) {
    return <div className="w-[400px]">{commandContent}</div>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading || !!error}
          className="w-full justify-between font-normal"
        >
          {isLoading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : error ? (
            <span className="text-destructive">Failed to load</span>
          ) : value ? (
            <span className="flex items-center gap-2 truncate">
              <span>{getTypeIcon(value.type)}</span>
              <span>{value.label}</span>
              <span className="text-muted-foreground text-xs truncate">
                {value.name}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        {commandContent}
      </PopoverContent>
    </Popover>
  )
}
