'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Zap, Maximize, Minimize, RefreshCw, RotateCcw, Wifi, WifiOff, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        return { color: 'bg-green-500', label: 'Live', icon: Wifi, animate: true }
      case 'connecting':
        return { color: 'bg-yellow-500', label: 'Connecting...', icon: Loader2, animate: false }
      default:
        return { color: 'bg-red-500', label: 'Disconnected', icon: WifiOff, animate: false }
    }
  })()

  const StatusIcon = statusDisplay.icon

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 overflow-hidden border-b border-border bg-card/50 px-4 py-2 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        {orgLogoUrl ? (
          <img src={orgLogoUrl} alt="" className="size-8 shrink-0 object-contain" />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg gradient-primary">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight text-foreground">{orgName}</h1>
          <p className="text-xs text-muted-foreground">Celebration Dashboard</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-1">
          {THEMES.map(({ name, label, icon: Icon }) => (
            <Button
              key={name}
              variant={theme === name ? 'default' : 'ghost'}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => applyTheme(name)}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
        </Button>
        {onReplayLast && (
          <Button variant="outline" size="sm" className="gap-2" onClick={onReplayLast} title="Replay last celebration">
            <RotateCcw className="size-3.5" />
            Replay Last
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.location.reload()}
          title="Refresh page"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
        <div className="flex items-center gap-2 rounded-md bg-secondary/30 px-2 py-1">
          <div
            className={`size-2 rounded-full ${statusDisplay.color} ${statusDisplay.animate ? 'animate-pulse' : ''}`}
          />
          <StatusIcon
            className={`size-3.5 text-muted-foreground ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`}
          />
          <span className="text-sm text-muted-foreground">{statusDisplay.label}</span>
        </div>
      </div>
    </header>
  )
}
