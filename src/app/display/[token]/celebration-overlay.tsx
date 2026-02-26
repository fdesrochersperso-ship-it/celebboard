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
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      {/* GIF background */}
      <div className="absolute inset-0">
        <img
          src={gifUrl}
          alt=""
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      <Confetti isClosing={exiting} />

      <div
        className={`relative z-10 flex flex-col items-center px-8 text-center ${
          exiting ? 'animate-celebration-exit' : 'animate-celebration-enter'
        }`}
      >
        <h2
          className="font-bold tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            textShadow: '0 0 40px rgba(255,255,255,0.3), 0 2px 10px rgba(0,0,0,0.8)',
          }}
        >
          {current.title}
        </h2>

        {members.length > 0 && (
          <div
            className="mt-8 flex flex-wrap justify-center gap-6"
            style={{ gap: 'clamp(1rem, 2vw, 1.5rem)' }}
          >
            {members.map((m) => (
              <div key={m.id} className="flex flex-col items-center gap-3">
                <div
                  className="overflow-hidden rounded-full border-4 border-amber-400/90 bg-zinc-800"
                  style={{
                    width: 'clamp(60px, 10vw, 80px)',
                    height: 'clamp(60px, 10vw, 80px)',
                    boxShadow: '0 0 24px rgba(251, 191, 36, 0.5), inset 0 0 16px rgba(255,255,255,0.1)',
                  }}
                >
                  {m.photo_url ? (
                    <img
                      src={m.photo_url}
                      alt={m.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-xl font-bold text-zinc-400">
                      {getInitials(m.name)}
                    </div>
                  )}
                </div>
                <p
                  className="font-medium text-white drop-shadow-md"
                  style={{ fontSize: 'clamp(0.85rem, 1.4vw, 1.1rem)' }}
                >
                  {m.name}
                </p>
              </div>
            ))}
          </div>
        )}

        {current.amount != null && (
          <p
            className="mt-8 font-bold tabular-nums text-amber-400"
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              textShadow: '0 0 40px rgba(251, 191, 36, 0.5), 0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
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
          <p
            className="mt-4 text-white/90 drop-shadow-md"
            style={{ fontSize: 'clamp(1.25rem, 2.5vw, 2rem)' }}
          >
            {current.subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
