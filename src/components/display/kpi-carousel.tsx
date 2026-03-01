'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { KpiCard } from './kpi-card'

type Kpi = {
  id: string
  label: string
  format: string
  currency: string
  value: number | null
  refresh_seconds?: number | null
}

type Props = {
  kpis: Kpi[]
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
        <KpiCard key={kpi.id} kpi={kpi} variantIndex={(currentIndex + i) % kpis.length} />
      ))}
    </div>
  )
}
