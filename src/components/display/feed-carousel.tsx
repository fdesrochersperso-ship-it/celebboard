'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Sparkles, Wifi, WifiOff } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const EMOJI_MAP: Record<string, string> = {
  smile: '😄',
  smiley: '😃',
  grinning: '😀',
  blush: '😊',
  wink: '😉',
  heart_eyes: '😍',
  joy: '😂',
  thumbsup: '👍',
  '+1': '👍',
  thumbsdown: '👎',
  '-1': '👎',
  clap: '👏',
  pray: '🙏',
  fire: '🔥',
  sparkles: '✨',
  heart: '❤️',
  star: '⭐',
  tada: '🎉',
  trophy: '🏆',
  '100': '💯',
  eyes: '👀',
  rocket: '🚀',
  muscle: '💪',
}

export type FeedItem = {
  id: string
  author_name: string
  content_type: string
  text_content: string | null
  image_url: string | null
  source: string
  metadata?: { reactions?: Array<{ name: string; count: number }> } | null
  created_at: string
}

type Props = {
  items: FeedItem[]
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
  rotationSeconds?: number
  onVisibilityChange?: () => void
}

function getEmoji(name: string): string {
  return EMOJI_MAP[name.toLowerCase()] ?? `:${name}:`
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function FeedCarousel({
  items,
  connectionStatus,
  rotationSeconds = 25,
  onVisibilityChange,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') onVisibilityChange?.()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [onVisibilityChange])

  useEffect(() => {
    if (items.length <= 1) return
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length)
        setIsTransitioning(false)
      }, 300)
    }, rotationSeconds * 1000)
    return () => clearInterval(interval)
  }, [items.length, rotationSeconds])

  if (items.length === 0) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-border bg-card/50 p-6 text-center backdrop-blur">
        <div className="absolute right-2 top-2 z-10">
          {connectionStatus === 'connected' ? (
            <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
              <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </div>
          ) : connectionStatus === 'connecting' ? (
            <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-500">
              <Wifi className="size-2.5 animate-pulse" />
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-500">
              <WifiOff className="size-2.5" />
            </div>
          )}
        </div>
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-7 text-primary/60" />
        </div>
        <p className="text-muted-foreground" style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)' }}>
          No posts yet
        </p>
        <p className="mt-1 text-sm text-muted-foreground/70">Scan QR to share</p>
      </div>
    )
  }

  const current = items[currentIndex]!
  const reactions = (current.metadata as { reactions?: Array<{ name: string; count: number }> } | null)
    ?.reactions ?? []

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card/50 backdrop-blur">
      <div className="absolute right-2 top-2 z-10">
        {connectionStatus === 'connected' ? (
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
            <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        ) : connectionStatus === 'connecting' ? (
          <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-500">
            <Wifi className="size-2.5 animate-pulse" />
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-500">
            <WifiOff className="size-2.5" />
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        {current.image_url && (
          <div className="absolute inset-0">
            <img
              src={current.image_url}
              alt=""
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
        )}
        <div
          className={`absolute inset-0 flex flex-col p-4 ${
            current.image_url
              ? 'justify-end text-white'
              : 'justify-center items-center text-center bg-gradient-to-br from-primary/10 to-muted/20'
          } ${isTransitioning ? 'opacity-0 transition-opacity duration-300' : 'opacity-100'}`}
        >
          {current.text_content && (
            <div className={current.image_url ? 'mb-3' : 'mb-4'}>
              {current.content_type === 'text' && !current.image_url && (
                <MessageSquare
                  className="mx-auto mb-2 size-10 text-primary/40"
                  style={{ minWidth: 40, minHeight: 40 }}
                />
              )}
              <p
                className={`font-medium leading-relaxed ${
                  current.image_url
                    ? 'text-base text-white drop-shadow-lg md:text-lg'
                    : 'text-xl text-foreground md:text-2xl'
                }`}
              >
                &ldquo;{current.text_content}&rdquo;
              </p>
            </div>
          )}
          {reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 ${current.image_url ? 'mb-2' : 'mb-3'}`}>
              {reactions.slice(0, 6).map((r, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs ${
                    current.image_url ? 'bg-white/20' : 'bg-muted'
                  }`}
                >
                  {getEmoji(r.name)}
                  <span className="opacity-80">{r.count}</span>
                </span>
              ))}
            </div>
          )}
          <div
            className={`flex items-center gap-2 ${
              current.image_url ? 'text-sm text-white/90' : 'text-muted-foreground'
            }`}
          >
            <Avatar className="size-6">
              <AvatarFallback className="bg-primary/20 text-xs text-primary">
                {getInitials(current.author_name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{current.author_name}</span>
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 border-t border-border bg-background/50 py-2 backdrop-blur-sm">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to item ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
