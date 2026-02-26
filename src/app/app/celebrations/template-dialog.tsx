'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { createClient } from '@/lib/supabase-clients'
import { CELEBRATION_PRESETS } from '@/lib/celebrations/presets'

const VISUAL_STYLES = [
  { value: 'confetti', label: 'Confetti' },
  { value: 'fireworks', label: 'Fireworks' },
  { value: 'champagne', label: 'Champagne' },
] as const

const SOUNDS = [
  { value: 'victory', label: 'Victory fanfare' },
  { value: 'cash_register', label: 'Cash register' },
  { value: 'bell', label: 'Bell' },
  { value: 'applause', label: 'Applause' },
  { value: 'none', label: 'None' },
] as const

type TemplateRow = {
  id: string
  name: string
  title_pattern: string
  subtitle_pattern: string | null
  visual_style: string
  sound: string
  duration_seconds: number
  show_counter: boolean
  counter_label: string | null
  show_photos: boolean
  is_active: boolean
}

type PresetInput = (typeof CELEBRATION_PRESETS)[number]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  onSuccess: () => void
  template?: TemplateRow | null
  preset?: PresetInput | null
}

export function TemplateDialog({ open, onOpenChange, orgId, onSuccess, template, preset }: Props) {
  const isEdit = !!template

  const [name, setName] = useState('')
  const [titlePattern, setTitlePattern] = useState('')
  const [subtitlePattern, setSubtitlePattern] = useState('')
  const [visualStyle, setVisualStyle] = useState<string>('confetti')
  const [sound, setSound] = useState<string>('victory')
  const [duration, setDuration] = useState(20)
  const [showCounter, setShowCounter] = useState(false)
  const [counterLabel, setCounterLabel] = useState('')
  const [showPhotos, setShowPhotos] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name)
        setTitlePattern(template.title_pattern)
        setSubtitlePattern(template.subtitle_pattern ?? '')
        setVisualStyle(template.visual_style)
        setSound(template.sound)
        setDuration(template.duration_seconds)
        setShowCounter(template.show_counter)
        setCounterLabel(template.counter_label ?? '')
        setShowPhotos(template.show_photos)
      } else if (preset) {
        setName(preset.name)
        setTitlePattern(preset.title_pattern)
        setSubtitlePattern(preset.subtitle_pattern ?? '')
        setVisualStyle(preset.visual_style)
        setSound(preset.sound)
        setDuration(preset.duration_seconds)
        setShowCounter(preset.show_counter)
        setCounterLabel('')
        setShowPhotos(preset.show_photos)
      } else {
        setName('')
        setTitlePattern('')
        setSubtitlePattern('')
        setVisualStyle('confetti')
        setSound('victory')
        setDuration(20)
        setShowCounter(false)
        setCounterLabel('')
        setShowPhotos(true)
      }
      setError('')
    }
  }, [open, template, preset])

  const handleSave = async () => {
    setError('')
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!titlePattern.trim()) {
      setError('Title pattern is required')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const payload = {
        org_id: orgId,
        name: name.trim(),
        title_pattern: titlePattern.trim(),
        subtitle_pattern: subtitlePattern.trim() || null,
        visual_style: visualStyle,
        sound,
        duration_seconds: duration,
        show_counter: showCounter,
        counter_label: counterLabel.trim() || null,
        show_photos: showPhotos,
        is_active: true,
      }

      if (isEdit) {
        const { error: updateError } = await supabase
          .from('celebration_templates')
          .update(payload)
          .eq('id', template.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('celebration_templates')
          .insert(payload)

        if (insertError) throw insertError
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription>
            Configure how celebrations appear on your TV dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Deal Won"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title Pattern</Label>
            <Input
              id="title"
              placeholder="🎉 DEAL WON! or NEW CLIENT: {{company_name}}"
              value={titlePattern}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitlePattern(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Use {'{{field_name}}'} for dynamic values (e.g. {'{{deal_name}}'}, {'{{company_name}}'})
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle Pattern</Label>
            <Input
              id="subtitle"
              placeholder="{{owner_name}} closed {{deal_name}}"
              value={subtitlePattern}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubtitlePattern(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visual Style</Label>
              <Select value={visualStyle} onValueChange={setVisualStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISUAL_STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sound</Label>
              <Select value={sound} onValueChange={setSound}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOUNDS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (seconds)</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              max={60}
              value={duration}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDuration(parseInt(e.target.value, 10) || 20)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-counter">Show counter</Label>
            <Switch id="show-counter" checked={showCounter} onCheckedChange={setShowCounter} />
          </div>
          {showCounter && (
            <div className="space-y-2">
              <Label htmlFor="counter-label">Counter Label</Label>
              <Input
                id="counter-label"
                placeholder="This Quarter's Revenue"
                value={counterLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCounterLabel(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="show-photos">Show photos</Label>
            <Switch id="show-photos" checked={showPhotos} onCheckedChange={setShowPhotos} />
          </div>

          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-2 text-muted-foreground text-xs font-medium">Pattern preview</p>
            <p className="text-lg font-semibold">{titlePattern || '(empty)'}</p>
            {subtitlePattern && (
              <p className="mt-1 text-muted-foreground text-sm">{subtitlePattern}</p>
            )}
            <p className="mt-2 text-muted-foreground text-xs">
              Values will be filled from webhook payload at runtime.
            </p>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
