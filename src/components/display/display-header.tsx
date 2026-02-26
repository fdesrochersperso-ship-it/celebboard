'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Zap, Maximize, Minimize, RefreshCw, RotateCcw, Wifi, WifiOff, Loader2 } from 'lucide-react'

const THEMES = [
  { name: 'dark' as const, label: 'Dark', icon: Moon },
  { name: 'light' as const, label: 'Light', icon: Sun },
  { name: 'vibrant' as const, label: 'Vibrant', icon: Zap },
]

const STORAGE_KEY = 'celebboard-display-theme'

type ThemeName = 'dark' | 'light' | 'vibrant'
type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

type Props = {
  orgName: string
  orgLogoUrl?: string | null
  connectionStatus: ConnectionStatus
  onReplayLast?: () => void
}

export function DisplayHeader({ orgName, orgLogoUrl, connectionStatus, onReplayLast }: Props) {
  const [theme, setTheme] = useState<ThemeName>('dark')
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null
    if (stored && THEMES.some((t) => t.name === stored)) {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const applyTheme = (name: ThemeName) => {
    setTheme(name)
    document.documentElement.setAttribute('data-theme', name)
    try {
      localStorage.setItem(STORAGE_KEY, name)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const statusDisplay = (() => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'bg-emerald-500', label: 'Live', icon: Wifi, animate: true }
      case 'connecting':
        return { color: 'bg-amber-500', label: 'Connecting...', icon: Loader2, animate: false }
      default:
        return { color: 'bg-red-500', label: 'Disconnected', icon: WifiOff, animate: false }
    }
  })()

  const StatusIcon = statusDisplay.icon

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 overflow-hidden border-b border-border px-4 py-2 bg-card/50 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        {orgLogoUrl && (
          <img src={orgLogoUrl} alt="" className="size-9 shrink-0 object-contain" />
        )}
        <div className="min-w-0">
          <h1
            className="truncate font-bold text-foreground leading-tight"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}
          >
            {orgName}
          </h1>
          <p className="text-xs text-muted-foreground">Celebration Dashboard</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
          {THEMES.map(({ name, label, icon: Icon }) => (
            <button
              key={name}
              type="button"
              onClick={() => applyTheme(name)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                theme === name ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
        </button>
        {onReplayLast && (
          <button
            type="button"
            onClick={onReplayLast}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted"
            title="Replay last celebration"
          >
            <RotateCcw className="size-3.5" />
            Replay Last
          </button>
        )}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs hover:bg-muted"
          title="Refresh page"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
        <div className="flex items-center gap-2 rounded-md bg-muted/30 px-2 py-1.5">
          <div
            className={`size-2 rounded-full ${statusDisplay.color} ${statusDisplay.animate ? 'animate-pulse' : ''}`}
          />
          <StatusIcon
            className={`size-3.5 text-muted-foreground ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`}
          />
          <span className="text-xs text-muted-foreground">{statusDisplay.label}</span>
        </div>
      </div>
    </header>
  )
}
