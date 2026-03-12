'use client'

import { cn } from '@/lib/utils'

export type VisualStyle = 'confetti' | 'fireworks' | 'champagne'

const STYLES: { value: VisualStyle; label: string; emoji: string }[] = [
  { value: 'confetti', label: 'Confetti', emoji: '🎊' },
  { value: 'fireworks', label: 'Fireworks', emoji: '🎆' },
  { value: 'champagne', label: 'Champagne', emoji: '🍾' },
]

export interface VisualStylePickerProps {
  value: VisualStyle
  onChange: (value: VisualStyle) => void
}

export function VisualStylePicker({ value, onChange }: VisualStylePickerProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {STYLES.map((style) => (
        <button
          key={style.value}
          type="button"
          onClick={() => onChange(style.value)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
            value === style.value
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <div className="flex size-16 items-center justify-center rounded-lg bg-muted/50 text-3xl">
            {style.value === 'confetti' && (
              <span className="animate-pulse">✦ ✦ ✦</span>
            )}
            {style.value === 'fireworks' && (
              <span className="animate-pulse">✦ ✦</span>
            )}
            {style.value === 'champagne' && (
              <span className="animate-pulse">○ ○ ○</span>
            )}
          </div>
          <span className="text-sm font-medium">{style.emoji} {style.label}</span>
        </button>
      ))}
    </div>
  )
}
