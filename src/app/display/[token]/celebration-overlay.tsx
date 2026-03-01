'use client'

import { useEffect, useState, useRef } from 'react'
import { Confetti } from '@/components/display/confetti'
import { AnimatedCounter } from '@/components/display/animated-counter'
import { getRandomCelebrationGif } from '@/lib/display/celebration-gifs'
import { playCelebrationSound } from '@/lib/display/sounds'

type TeamMember = {
  id: string
  name: string
  photo_url: string | null
}

export type Celebration = {
  id: string
  title: string
  subtitle: string | null
  amount: number | null
  team_members?: TeamMember[]
  visual_style?: string
  sound?: string
  duration_seconds?: number
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function dismissAndAdvance(
  current: Celebration,
  queue: Celebration[],
  onDismiss: (c: Celebration) => void,
  setCurrent: (c: Celebration | null) => void,
  setGifUrl: (url: string) => void,
  setExiting: (v: boolean) => void,
  hasPlayedSound: React.MutableRefObject<boolean>
) {
  setExiting(true)
  setTimeout(() => {
    const idx = queue.findIndex((c) => c.id === current.id)
    const next = idx >= 0 && idx < queue.length - 1 ? queue[idx + 1]! : null
    onDismiss(current)
    setCurrent(next ?? null)
    if (next) {
      setGifUrl(getRandomCelebrationGif())
      hasPlayedSound.current = false
    }
    setExiting(false)
  }, 500)
}

export default function CelebrationOverlay({
  queue,
  onDismiss,
}: {
  queue: Celebration[]
  onDismiss: (celebration: Celebration) => void
}) {
  const [current, setCurrent] = useState<Celebration | null>(null)
  const [exiting, setExiting] = useState(false)
  const [gifUrl, setGifUrl] = useState('')
  const hasPlayedSound = useRef(false)

  useEffect(() => {
    if (queue.length > 0 && !current) {
      const next = queue[0]!
      setCurrent(next)
      setExiting(false)
      setGifUrl(getRandomCelebrationGif())
      hasPlayedSound.current = false
    }
  }, [queue, current])

  useEffect(() => {
    if (!current) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismissAndAdvance(
          current,
          queue,
          onDismiss,
          setCurrent,
          setGifUrl,
          setExiting,
          hasPlayedSound
        )
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [current, queue, onDismiss])

  useEffect(() => {
    if (!current) return

    if (!hasPlayedSound.current) {
      playCelebrationSound(current.sound ?? 'victory', 0.6)
      hasPlayedSound.current = true
    }

    const durationMs = (current.duration_seconds ?? 20) * 1000
    const timer = setTimeout(() => {
      dismissAndAdvance(
        current,
        queue,
        onDismiss,
        setCurrent,
        setGifUrl,
        setExiting,
        hasPlayedSound
      )
    }, durationMs)

    return () => clearTimeout(timer)
  }, [current?.id, queue, onDismiss])

  if (!current) return null

  const members = current.team_members ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      style={{
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      <Confetti isClosing={exiting} />

      <div
        className={`relative z-10 flex max-w-4xl flex-col items-center space-y-6 px-8 text-center ${
          exiting ? 'animate-celebration-exit' : 'animate-celebration-entrance'
        }`}
      >
        {members.length > 0 && (
          <div className="flex justify-center items-end gap-8">
            {members.map((m) => (
              <div key={m.id} className="relative flex flex-col items-center">
                <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
                <div className="relative size-36 overflow-hidden rounded-full border-4 border-primary shadow-elevated ring-4 ring-primary/30">
                  {m.photo_url ? (
                    <img
                      src={m.photo_url}
                      alt={m.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center bg-muted text-2xl font-bold text-muted-foreground">
                      {getInitials(m.name)}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground shadow-lg whitespace-nowrap">
                  {m.name}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4 pt-4">
          <h2
            className="text-5xl font-black tracking-tight md:text-6xl animate-title-glow"
            style={{
              background: 'linear-gradient(135deg, hsl(38, 95%, 55%), hsl(45, 100%, 60%), hsl(38, 95%, 65%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {current.title}
          </h2>

          {current.amount != null && (
            <p className="text-3xl font-black tabular-nums text-emerald-400 animate-pulse md:text-4xl">
              <AnimatedCounter
                value={current.amount}
                startFrom={0}
                duration={2000}
                formatAsCurrency
                currency="CAD"
                locale="en-CA"
                abbreviate
              />
            </p>
          )}

          {current.subtitle && (
            <p className="text-xl font-medium text-white/90 md:text-2xl">{current.subtitle}</p>
          )}
        </div>

        {gifUrl && (
          <div className="flex justify-center animate-gif-entrance pt-2">
            <img
              src={gifUrl}
              alt=""
              className="max-w-[350px] w-full rounded-2xl border-4 border-primary/50 shadow-elevated"
            />
          </div>
        )}

        <div className="flex justify-center gap-3 pt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="size-3 rounded-full bg-gradient-to-r from-primary to-accent animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
