'use client'

import * as React from 'react'
import { Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedCounter } from '@/components/display/animated-counter'
import { playCelebrationSound } from '@/lib/display/sounds'

const DEFAULT_SAMPLE: Record<string, string> = {
  dealname: 'Acme Corp Contract',
  deal_name: 'Acme Corp Contract',
  amount: '24500',
  hubspot_owner_id: 'Marie-Ève Tremblay',
  owner_name: 'Marie-Ève Tremblay',
  associatedcompanyname: 'Acme Corp',
  company_name: 'Acme Corp',
  account_manager: 'Jean-François Côté',
}

function resolveTemplate(
  pattern: string,
  sampleData: Record<string, string>
): string {
  return pattern.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const k = key.trim()
    return sampleData[k] ?? sampleData[k.replace(/_/g, '')] ?? ''
  })
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export interface CelebrationPreviewProps {
  titlePattern: string
  subtitlePattern: string
  visualStyle: string
  sound: string
  durationSeconds: number
  showPhotos: boolean
  photoFields: string[]
  showCounter: boolean
  counterLabel: string
  fieldMapping: Record<string, string>
  /** Override sample data. Keys are display field names. */
  sampleDataOverride?: Record<string, string>
  /** When true, show "Try different data" form */
  showDataForm?: boolean
  onSampleDataChange?: (data: Record<string, string>) => void
}

export function CelebrationPreview({
  titlePattern,
  subtitlePattern,
  visualStyle,
  sound,
  durationSeconds,
  showPhotos,
  photoFields,
  showCounter,
  counterLabel,
  fieldMapping,
  sampleDataOverride,
  showDataForm = false,
  onSampleDataChange,
}: CelebrationPreviewProps) {
  const [muted, setMuted] = React.useState(true)
  const [replayKey, setReplayKey] = React.useState(0)
  const [sampleData, setSampleData] = React.useState<Record<string, string>>(
    () => ({ ...DEFAULT_SAMPLE, ...sampleDataOverride })
  )
  const hasPlayedSound = React.useRef(false)

  React.useEffect(() => {
    setSampleData((prev) => ({ ...DEFAULT_SAMPLE, ...sampleDataOverride, ...prev }))
  }, [sampleDataOverride])

  const resolvedTitle = resolveTemplate(titlePattern, sampleData)
  const resolvedSubtitle = resolveTemplate(subtitlePattern, sampleData)
  const photoField = photoFields[0]
  const photoValue = photoField ? sampleData[photoField] ?? sampleData[fieldMapping[photoField] ?? ''] ?? sampleData['owner_name'] ?? sampleData['hubspot_owner_id'] : ''
  const amountNum = parseFloat(sampleData.amount ?? sampleData.dealname ?? '0') || 24500

  React.useEffect(() => {
    if (!muted && sound && sound !== 'none' && !hasPlayedSound.current) {
      playCelebrationSound(sound, 0.5)
      hasPlayedSound.current = true
    }
  }, [muted, sound, replayKey])

  const handleReplay = () => {
    setReplayKey((k) => k + 1)
    hasPlayedSound.current = false
    if (!muted && sound && sound !== 'none') {
      playCelebrationSound(sound, 0.5)
      hasPlayedSound.current = true
    }
  }

  const displayFields = React.useMemo(() => {
    const fromTitle = [...(titlePattern.match(/\{\{([^}]+)\}\}/g) ?? [])].map(
      (m) => m.replace(/\{\{|\}\}/g, '').trim()
    )
    const fromSubtitle = [...(subtitlePattern.match(/\{\{([^}]+)\}\}/g) ?? [])].map(
      (m) => m.replace(/\{\{|\}\}/g, '').trim()
    )
    return [...new Set([...fromTitle, ...fromSubtitle])]
  }, [titlePattern, subtitlePattern])

  const handleSampleChange = (key: string, value: string) => {
    const next = { ...sampleData, [key]: value }
    setSampleData(next)
    onSampleDataChange?.(next)
  }

  return (
    <div className="space-y-4">
      <div
        className="relative mx-auto overflow-hidden rounded-xl border-4 border-[#1a2332] shadow-2xl"
        style={{
          backgroundColor: '#0a0f1e',
          aspectRatio: '16/9',
          maxWidth: '100%',
          boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div key={replayKey} className="absolute inset-0 flex items-center justify-center">
          {visualStyle === 'confetti' && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti-fall"
                  style={{
                    left: `${(i * 3.3) % 100}%`,
                    top: -20,
                    width: 8,
                    height: 8,
                    backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'][i % 6],
                    borderRadius: i % 3 === 0 ? '50%' : '2px',
                    animationDelay: `${(i % 10) * 0.2}s`,
                  }}
                />
              ))}
            </div>
          )}
          {visualStyle === 'fireworks' && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute size-2 animate-ping rounded-full bg-amber-400"
                  style={{
                    left: `${30 + (i % 4) * 15}%`,
                    top: `${20 + Math.floor(i / 4) * 25}%`,
                    animationDelay: `${i * 0.15}s`,
                    boxShadow: '0 0 20px 4px rgba(251,191,36,0.6)',
                  }}
                />
              ))}
            </div>
          )}
          {visualStyle === 'champagne' && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute size-3 rounded-full bg-amber-200/80 animate-bounce"
                  style={{
                    left: `${10 + (i % 5) * 20}%`,
                    bottom: '-10%',
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '2s',
                  }}
                />
              ))}
            </div>
          )}

          <div
            className={`relative z-10 flex flex-col items-center justify-center px-8 text-center ${
              replayKey >= 0 ? 'animate-celebration-entrance' : ''
            }`}
          >
            {showPhotos && photoValue && (
              <div className="mb-4 flex flex-col items-center">
                <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-primary bg-muted text-2xl font-bold text-muted-foreground">
                  {getInitials(photoValue)}
                </div>
                <span className="mt-2 text-sm font-medium text-white/90">{photoValue}</span>
              </div>
            )}

            <h2
              className="text-3xl font-black tracking-tight md:text-4xl animate-title-glow"
              style={{
                background: 'linear-gradient(135deg, hsl(38, 95%, 55%), hsl(45, 100%, 60%), hsl(38, 95%, 65%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {resolvedTitle || '🎉 Celebration!'}
            </h2>

            {showCounter && (
              <p className="mt-2 text-xl font-bold text-emerald-400">
                {counterLabel || 'Total'}:{' '}
                <AnimatedCounter
                  value={amountNum}
                  startFrom={0}
                  duration={1500}
                  formatAsCurrency
                  currency="CAD"
                  locale="en-CA"
                />
              </p>
            )}

            {resolvedSubtitle && (
              <p className="mt-2 text-lg text-white/90">{resolvedSubtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMuted(!muted)}
        >
          {muted ? (
            <>
              <VolumeX className="mr-1.5 size-4" />
              Unmute
            </>
          ) : (
            <>
              <Volume2 className="mr-1.5 size-4" />
              Mute
            </>
          )}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleReplay}>
          <RotateCcw className="mr-1.5 size-4" />
          Replay
        </Button>
      </div>

      {showDataForm && displayFields.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <h3 className="mb-3 text-sm font-medium">Try with different data</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {displayFields.map((field) => (
              <div key={field} className="space-y-1">
                <Label htmlFor={`sample-${field}`} className="text-xs">
                  {field}
                </Label>
                <Input
                  id={`sample-${field}`}
                  value={sampleData[field] ?? ''}
                  onChange={(e) => handleSampleChange(field, e.target.value)}
                  placeholder={DEFAULT_SAMPLE[field] ?? ''}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
