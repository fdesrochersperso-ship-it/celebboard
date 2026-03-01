'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import CelebrationOverlay from './celebration-overlay'
import type { Celebration } from './celebration-overlay'
import { DisplayHeader } from '@/components/display/display-header'
import { KpiCarousel } from '@/components/display/kpi-carousel'
import { FeedCarousel, type FeedItem } from '@/components/display/feed-carousel'
import { QrCodeCard } from '@/components/display/qr-code-card'
import { KpiChart } from '@/components/display/kpi-chart'
import { RecentWins } from '@/components/display/recent-wins'
import { Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase-clients'

type OrgData = {
  id: string
  name: string
  display_token: string
  logo_url?: string | null
}

type Kpi = {
  id: string
  label: string
  format: string
  currency: string
  value: number | null
  refresh_seconds?: number
}

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

const POLL_INTERVAL_MS = 5000

async function fetchCelebrations(token: string): Promise<Celebration[]> {
  const res = await fetch(`/api/display/${encodeURIComponent(token)}/celebrations?limit=10`)
  if (!res.ok) return []
  const { celebrations } = await res.json()
  return celebrations ?? []
}

async function fetchCelebrationById(token: string, id: string): Promise<Celebration | null> {
  const res = await fetch(
    `/api/display/${encodeURIComponent(token)}/celebrations?${new URLSearchParams({ id })}`
  )
  if (!res.ok) return null
  const { celebrations } = await res.json()
  return Array.isArray(celebrations) && celebrations.length > 0 ? celebrations[0]! : null
}

async function fetchKpis(token: string): Promise<Kpi[]> {
  const res = await fetch(`/api/display/${encodeURIComponent(token)}/kpis`)
  if (!res.ok) return []
  const { kpis } = await res.json()
  return kpis ?? []
}

async function fetchFeed(token: string): Promise<FeedItem[]> {
  const res = await fetch(`/api/display/${encodeURIComponent(token)}/feed`)
  if (!res.ok) return []
  const { items } = await res.json()
  return items ?? []
}

async function fetchFeedRotationSeconds(token: string): Promise<number> {
  const res = await fetch(`/api/display/${encodeURIComponent(token)}/config`)
  if (!res.ok) return 25
  const data = await res.json()
  return data.feed_rotation_seconds ?? 25
}

export default function DisplayDashboard({ org }: { org: OrgData }) {
  const [celebrations, setCelebrations] = useState<Celebration[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [queue, setQueue] = useState<Celebration[]>([])
  const [feedRotationSeconds, setFeedRotationSeconds] = useState(25)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [lastCelebration, setLastCelebration] = useState<Celebration | null>(null)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const reconnectAttempts = useRef(0)
  const sessionStartedAtRef = useRef<number>(Date.now())

  const token = org.display_token

  const setupRealtime = useCallback(() => {
    if (!token || !org.id) return
    const supabase = createClient()
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    setConnectionStatus('connecting')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ch = supabase.channel(`display-${org.id}-${Date.now()}`) as any
    const channel = ch
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'celebrations',
          filter: `org_id=eq.${org.id}`,
        },
        async (payload: { new?: { id: string; created_at?: string } }) => {
          const insertedId = payload.new?.id
          if (!insertedId) return

          const createdAt = payload.new?.created_at
          const sessionStart = sessionStartedAtRef.current - 2000
          if (createdAt && new Date(createdAt).getTime() < sessionStart) return

          if (seenIdsRef.current.has(insertedId)) return

          const celebration = await fetchCelebrationById(token, insertedId)
          if (!celebration) return

          seenIdsRef.current.add(celebration.id)
          setLastCelebration(celebration)
          setQueue((prev) => {
            if (prev.some((p) => p.id === celebration.id)) return prev
            return [celebration, ...prev]
          })

          const data = await fetchCelebrations(token)
          setCelebrations(data.slice(0, 5))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_items',
          filter: `org_id=eq.${org.id}`,
        },
        async () => {
          const items = await fetchFeed(token)
          setFeedItems(items)
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
          reconnectAttempts.current = 0
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnectionStatus('disconnected')
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++
          setTimeout(setupRealtime, delay)
        } else if (status === 'CLOSED') {
          setConnectionStatus('disconnected')
        }
      })
    channelRef.current = ch
  }, [org.id, token])

  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        const [celebrationsData, kpisData, feedData, rotation] = await Promise.all([
          fetchCelebrations(token),
          fetchKpis(token),
          fetchFeed(token),
          fetchFeedRotationSeconds(token),
        ])
        setCelebrations(celebrationsData.slice(0, 5))
        setKpis(kpisData)
        setFeedItems(feedData)
        setFeedRotationSeconds(rotation)
        if (celebrationsData.length > 0) setLastCelebration(celebrationsData[0] ?? null)
        if (connectionStatus === 'connecting') setConnectionStatus('connected')
      } catch {
        setConnectionStatus('disconnected')
      }
    }
    load()
    setupRealtime()
    const poll = setInterval(load, POLL_INTERVAL_MS)
    return () => {
      clearInterval(poll)
      if (channelRef.current) {
        createClient().removeChannel(channelRef.current)
      }
    }
  }, [token, setupRealtime])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        reconnectAttempts.current = 0
        setupRealtime()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [setupRealtime])

  const handleOverlayDismiss = (celebration: Celebration) => {
    setQueue((prev) => prev.filter((c) => c.id !== celebration.id))
  }

  const handleReplayLast = () => {
    if (!lastCelebration) return
    setQueue((prev) => {
      if (prev.some((p) => p.id === lastCelebration.id)) return prev
      return [lastCelebration, ...prev]
    })
  }

  const handleTestCelebration = useCallback(() => {
    const mock: Celebration = {
      id: `test-${Date.now()}`,
      title: 'Test Celebration',
      subtitle: 'Press T to add • Escape to dismiss',
      amount: 45000,
      team_members: [
        { id: 'tm-1', name: 'Alex Chen', photo_url: null },
        { id: 'tm-2', name: 'Jordan Smith', photo_url: null },
      ],
      sound: 'victory',
      duration_seconds: 5,
    }
    setQueue((prev) => [mock, ...prev])
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          handleTestCelebration()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleTestCelebration])

  return (
    <div
      className="flex w-screen flex-col overflow-hidden bg-background text-foreground"
      style={{ height: '100dvh' }}
    >
      <DisplayHeader
        orgName={org.name}
        orgLogoUrl={org.logo_url}
        connectionStatus={connectionStatus}
        onReplayLast={lastCelebration ? handleReplayLast : undefined}
      />

      <CelebrationOverlay queue={queue} onDismiss={handleOverlayDismiss} />

      <main className="flex flex-1 flex-col gap-3 overflow-hidden p-3">
        {/* KPI Carousel */}
        <div className="shrink-0">
          <KpiCarousel kpis={kpis} />
        </div>

        {/* Main content grid: 12 columns */}
        <div
          className="grid flex-1 gap-3"
          style={{
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            minHeight: 0,
          }}
        >
          {/* Feed: col-span-4, row-span-4 */}
          <section className="col-span-4 row-span-4 flex min-h-0 flex-col">
            <FeedCarousel
            items={feedItems}
            connectionStatus={connectionStatus}
            rotationSeconds={feedRotationSeconds}
            onVisibilityChange={() => fetchFeed(token).then(setFeedItems)}
          />
          </section>

          {/* Chart: col-span-5, row-span-4 */}
          <section className="col-span-5 row-span-4 flex min-h-0 flex-col" style={{ minHeight: 320 }}>
            <KpiChart title="New Subscribers by Week" />
          </section>

          {/* Recent Wins: col-span-3, row-span-2 */}
          <section className="col-span-3 row-span-2 flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card/50 shadow-card">
            <h2 className="flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground">
              <Trophy className="size-4 text-accent" />
              Recent Wins
            </h2>
            <div className="min-h-0 flex-1 overflow-hidden p-2">
              <RecentWins celebrations={celebrations} />
            </div>
          </section>

          {/* QR Code: col-span-3, row-span-2 */}
          <section className="col-span-3 row-span-2 flex min-h-0 flex-col">
            <QrCodeCard orgId={org.id} compact />
          </section>
        </div>
      </main>
    </div>
  )
}
