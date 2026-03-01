'use client'

import { useEffect, useState, useRef } from 'react'
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { AnimatedCounter } from './animated-counter'

const GRADIENT_VARIANTS = ['gradient-primary', 'gradient-success', 'gradient-celebration', 'gradient-primary'] as const

function getIconForLabel(label: string): LucideIcon {
  const lower = label.toLowerCase()
  if (lower.includes('revenue') || lower.includes('sales') || lower.includes('amount')) return DollarSign
  if (lower.includes('user') || lower.includes('customer') || lower.includes('subscriber')) return Users
  if (lower.includes('target') || lower.includes('goal')) return Target
  return TrendingUp
}

function formatDisplayValue(
  value: number,
  format: string,
  currency: string,
  locale: string
): string {
  if (format === 'currency') {
    if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (format === 'percentage') {
    return `${value.toLocaleString(locale, { maximumFractionDigits: 1 })}%`
  }
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString(locale)
}

type Kpi = {
  id: string
  label: string
  format: string
  currency: string
  value: number | null
  refresh_seconds?: number | null
}

type Props = {
  kpi: Kpi
  variantIndex?: number
}

export function KpiCard({ kpi, variantIndex = 0 }: Props) {
  const [pulse, setPulse] = useState(false)
  const prevValue = useRef<number | null>(kpi.value ?? null)

  const isLive = (kpi.refresh_seconds ?? 300) < 60
  const Icon = getIconForLabel(kpi.label)
  const gradientClass = GRADIENT_VARIANTS[variantIndex % GRADIENT_VARIANTS.length] ?? 'gradient-primary'

  useEffect(() => {
    if (kpi.value != null && prevValue.current !== kpi.value) {
      setPulse(true)
      prevValue.current = kpi.value
      const t = setTimeout(() => setPulse(false), 800)
      return () => clearTimeout(t)
    }
  }, [kpi.value])

  return (
    <div
      className={`
        relative h-full overflow-hidden rounded-lg border border-border bg-card shadow-card transition-smooth
        p-6
        ${pulse ? 'animate-kpi-pulse ring-2 ring-primary/50' : ''}
      `}
    >
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex size-14 items-center justify-center rounded-xl ${gradientClass} text-primary-foreground`}
        >
          <Icon className="size-7" />
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-red-500">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative size-2 rounded-full bg-red-500" />
              </span>
              Live
            </span>
          )}
        </div>
      </div>
      <p className="mb-2 text-xl font-semibold text-foreground/80">{kpi.label}</p>
      <p className="text-4xl font-bold tabular-nums text-foreground">
        {kpi.format === 'currency' && kpi.value != null ? (
          <AnimatedCounter
            value={kpi.value}
            startFrom={prevValue.current ?? 0}
            duration={800}
            formatAsCurrency
            currency={kpi.currency || 'CAD'}
            locale="en-CA"
            abbreviate
            className={pulse ? 'scale-105' : ''}
          />
        ) : kpi.format === 'percentage' && kpi.value != null ? (
          formatDisplayValue(kpi.value, 'percentage', kpi.currency, 'en-CA')
        ) : kpi.value != null ? (
          <AnimatedCounter
            value={kpi.value}
            startFrom={prevValue.current ?? 0}
            duration={800}
            formatAsCurrency={false}
            locale="en-CA"
            abbreviate
            className={pulse ? 'scale-105' : ''}
          />
        ) : (
          '—'
        )}
      </p>
    </div>
  )
}
