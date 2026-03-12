'use client'

import * as React from 'react'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

const SOUND_OPTIONS = [
  { value: 'victory', label: 'Victory Fanfare', emoji: '🎺', url: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3' },
  { value: 'cash_register', label: 'Cash Register', emoji: '💰', url: 'https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3' },
  { value: 'bell', label: 'Bell', emoji: '🔔', url: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3' },
  { value: 'applause', label: 'Applause', emoji: '👏', url: 'https://assets.mixkit.co/active_storage/sfx/566/566-preview.mp3' },
  { value: 'drumroll', label: 'Drumroll', emoji: '🥁', url: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3' },
  { value: 'none', label: 'No Sound', emoji: '🔇', url: '' },
] as const

export type SoundValue = (typeof SOUND_OPTIONS)[number]['value']

export interface SoundPickerProps {
  value: SoundValue
  onChange: (value: SoundValue) => void
}

function playPreview(url: string) {
  if (!url) return
  try {
    const audio = new Audio(url)
    audio.volume = 0.6
    audio.play().catch((err) => console.warn('Audio play failed:', err))
  } catch (err) {
    console.warn('Sound playback error:', err)
  }
}

export function SoundPicker({ value, onChange }: SoundPickerProps) {
  const [playing, setPlaying] = React.useState<string | null>(null)

  const handlePlay = (opt: (typeof SOUND_OPTIONS)[number]) => {
    if (opt.value === 'none') return
    setPlaying(opt.value)
    playPreview(opt.url)
    setTimeout(() => setPlaying(null), 2500)
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {SOUND_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
            value === opt.value
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{opt.emoji}</span>
            {opt.value !== 'none' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlay(opt)
                }}
                className="rounded-full bg-muted p-1.5 transition-colors hover:bg-muted/80"
                aria-label={`Play ${opt.label}`}
              >
                <Play className={cn('size-4', playing === opt.value && 'text-primary')} />
              </button>
            )}
          </div>
          <span className="text-sm font-medium">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
