'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { KpiCard } from './kpi-card'
import { LeaderKpiCard } from './leader-kpi-card'
import { PaceKpiCard } from './pace-kpi-card'

type Leader = {
  id: string
  name: string
  photo_url: string | null
  value: number
}

type Kpi = {
  id: string
  label: string
  format: string
  currency: string
  value: number | null
  goal?: number | null
  leaders?: Leader[]
  refresh_seconds?: number | null
}

type Props = {
  kpis: Kpi[]
}

function KpiCardVariant({ kpi, variantIndex }: { kpi: Kpi; variantIndex: number }) {
  const hasLeaders = (kpi.leaders?.length ?? 0) > 0
  const hasGoal = kpi.goal != null && kpi.goal > 0

  if (hasGoal) {
    return <PaceKpiCard kpi={kpi} variantIndex={variantIndex} />
  }
  if (hasLeaders) {
    return <LeaderKpiCard kpi={kpi} variantIndex={variantIndex} />
  }
  return <KpiCard kpi={kpi} variantIndex={variantIndex} />
}

const AUTO_SCROLL_INTERVAL_MS = 5000
const SLIDES_PER_VIEW = 4

export function KpiCarousel({ kpis }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const maxIndex = Math.max(0, kpis.length - SLIDES_PER_VIEW)
  const shouldScroll = kpis.length > SLIDES_PER_VIEW

  const scrollNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  useEffect(() => {
    if (!shouldScroll || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }
    intervalRef.current = setInterval(scrollNext, AUTO_SCROLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [shouldScroll, scrollNext, isPaused])

  if (kpis.length === 0) {
    return (
      <div
        className="flex min-h-[100px] flex-col items-center justify-center gap-1 rounded-lg border border-border bg-card/50 px-4"
        style={{ gridColumn: '1 / -1' }}
      >
        <p className="text-muted-foreground">No KPIs configured</p>
        <p className="text-sm text-muted-foreground/70">Add KPIs in settings to see metrics</p>
      </div>
    )
  }

  const visibleKpis = shouldScroll
    ? [...kpis.slice(currentIndex), ...kpis.slice(0, currentIndex)].slice(0, SLIDES_PER_VIEW)
    : kpis

  return (
    <div
      className="grid shrink-0 gap-3"
      style={{ gridTemplateColumns: `repeat(${Math.min(SLIDES_PER_VIEW, kpis.length)}, 1fr)` }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {visibleKpis.map((kpi, i) => (
        <KpiCardVariant
          key={kpi.id}
          kpi={kpi}
          variantIndex={(currentIndex + i) % kpis.length}
        />
      ))}
    </div>
  )
}
