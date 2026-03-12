'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PropertySelector } from './property-selector'
import { useIntegrationSchema } from '@/lib/hooks/useIntegrationSchema'
import type { PropertyForDropdown } from '@/lib/hooks/useIntegrationSchema'

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
): PropertyForDropdown | null {
  const scores = properties.map((p) => ({
    prop: p,
    score: Math.max(
      similarity(displayField, p.name),
      similarity(displayField, p.label)
    ),
  }))
  scores.sort((a, b) => b.score - a.score)
  return scores[0]?.score > 0.5 ? scores[0].prop : null
}

const KNOWN_ALIASES: Record<string, string> = {
  deal_name: 'dealname',
  dealname: 'dealname',
  amount: 'amount',
  company_name: 'associatedcompanyname',
  owner_name: 'hubspot_owner_id',
  account_manager: 'account_manager',
}

export interface FieldMappingTableProps {
  mappings: Record<string, string>
  integrationId: string | null
  objectType?: 'deals' | 'contacts' | 'companies'
  onChange: (mappings: Record<string, string>) => void
  displayFields?: string[]
  /** When provided, shows "Add custom field" button. Called with the new field name. */
  onAddCustomField?: (fieldName: string) => void
}

export function FieldMappingTable({
  mappings,
  integrationId,
  objectType = 'deals',
  onChange,
  displayFields = [],
  onAddCustomField,
}: FieldMappingTableProps) {
  const { properties } = useIntegrationSchema({ integrationId, objectType })
  const [customFieldName, setCustomFieldName] = React.useState('')

  const fieldsToShow = React.useMemo(() => {
    const fromMappings = Object.keys(mappings)
    const combined = [...new Set([...displayFields, ...fromMappings])]
    return combined.filter(Boolean).sort()
  }, [displayFields, mappings])

  const getPropertyByInternalName = (name: string): PropertyForDropdown | null =>
    properties.find((p) => p.name === name) ?? null

  const handleMappingChange = (displayField: string, internalName: string) => {
    onChange({ ...mappings, [displayField]: internalName })
  }

  const handlePropertySelect = (displayField: string) => (prop: PropertyForDropdown) => {
    handleMappingChange(displayField, prop.name)
  }

  const getSuggestedMapping = (displayField: string): PropertyForDropdown | null => {
    const alias = KNOWN_ALIASES[displayField]
    if (alias) {
      const p = getPropertyByInternalName(alias)
      if (p) return p
    }
    return suggestMapping(displayField, properties)
  }

  const handleAutoMap = () => {
    const updates: Record<string, string> = { ...mappings }
    for (const df of fieldsToShow) {
      if (updates[df]) continue
      const suggested = getSuggestedMapping(df)
      if (suggested) updates[df] = suggested.name
    }
    onChange(updates)
  }

  if (fieldsToShow.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No display fields to map. Add fields in your title/subtitle patterns first.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={handleAutoMap}>
          Auto-map suggestions
        </Button>
      </div>
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Display Field</TableHead>
          <TableHead>HubSpot Property</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fieldsToShow.map((displayField) => {
          const internalName = mappings[displayField]
          const mappedProperty = internalName ? getPropertyByInternalName(internalName) : null
          const isMapped = !!mappedProperty

          return (
            <TableRow key={displayField}>
              <TableCell className="font-medium">{displayField}</TableCell>
              <TableCell>
                <PropertySelector
                  integrationId={integrationId}
                  objectType={objectType}
                  value={mappedProperty}
                  onSelect={handlePropertySelect(displayField)}
                  placeholder="Select property..."
                />
              </TableCell>
              <TableCell>
                {isMapped ? (
                  <Badge variant="default" className="bg-emerald-600">
                    Mapped
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    Needs mapping
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
      {onAddCustomField && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Custom field name"
            value={customFieldName}
            onChange={(e) => setCustomFieldName(e.target.value)}
            className="max-w-[200px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const name = customFieldName.trim().replace(/\s+/g, '_').toLowerCase()
                if (name) {
                  onAddCustomField(name)
                  setCustomFieldName('')
                }
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const name = customFieldName.trim().replace(/\s+/g, '_').toLowerCase()
              if (name) {
                onAddCustomField(name)
                setCustomFieldName('')
              }
            }}
          >
            <Plus className="mr-1 size-4" />
            Add custom field
          </Button>
        </div>
      )}
    </div>
  )
}
