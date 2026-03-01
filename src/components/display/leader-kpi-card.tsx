'use client'

import { useEffect, useState, useRef } from 'react'
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react'
import { AnimatedCounter } from './animated-counter'

const GRADIENT_VARIANTS = ['gradient-primary', 'gradient-success', 'gradient-celebration', 'gradient-primary'] as const
const RANK_EMOJIS = ['🥇', '🥈', '🥉'] as const
const RANK_COLORS = ['text-yellow-500', 'text-slate-400', 'text-amber-700'] as const

function getIconForLabel(label: string): LucideIcon {
  const lower = label.toLowerCase()
  if (lower.includes('revenue') || lower.includes('sales') || lower.includes('amount') || lower.includes('cash')) return DollarSign
  if (lower.includes('user') || lower.includes('customer') || lower.includes('subscriber')) return Users
  if (lower.includes('target') || lower.includes('goal')) return Target
  if (lower.includes('accepted') || lower.includes('closed')) return CheckCircle
  return TrendingUp
}

function formatLeaderValue(value: number, format: string, currency: string): string {
  if (format === 'currency') {
    const abs = Math.abs(value)
    if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString()
}

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
  leaders?: Leader[]
  refresh_seconds?: number | null
}

type Props = {
  kpi: Kpi
  variantIndex?: number
}

export function LeaderKpiCard({ kpi, variantIndex = 0 }: Props) {
  const [pulse, setPulse] = useState(false)
  const prevValue = useRef<number | null>(kpi.value ?? null)

  const isLive = (kpi.refresh_seconds ?? 300) < 60
  const Icon = getIconForLabel(kpi.label)
  const gradientClass = GRADIENT_VARIANTS[variantIndex % GRADIENT_VARIANTS.length] ?? 'gradient-primary'
  const leaders = (kpi.leaders ?? []).slice(0, 3)

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
        relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card p-6 shadow-card transition-smooth
        ${pulse ? 'animate-kpi-pulse ring-2 ring-primary/50' : ''}
      `}
    >
      <div className="mb-3 flex items-start justify-between">
        <div
          className={`flex size-14 items-center justify-center rounded-xl ${gradientClass} text-primary-foreground`}
        >
          <Icon className="size-7" />
        </div>
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
      <p className="mb-1 text-xl font-semibold text-foreground/80">{kpi.label}</p>
      <p className="mb-4 text-4xl font-bold tabular-nums text-foreground">
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

      {leaders.length > 0 && (
        <div className="mt-auto flex items-end justify-start gap-3 pt-2">
          {leaders.map((leader, idx) => (
            <div key={leader.id} className="relative flex flex-col items-center">
              <div className="relative">
                <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
                  {leader.photo_url ? (
                    <img
                      src={leader.photo_url}
                      alt={leader.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {leader.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="absolute -right-2 -top-2 text-base leading-none">
                  {RANK_EMOJIS[idx]}
                </span>
              </div>
              <span
                className="mt-1 max-w-[60px] truncate text-xs font-medium text-foreground"
                title={leader.name}
              >
                {leader.name}
              </span>
              <span
                className={`text-[11px] font-bold ${RANK_COLORS[idx] ?? 'text-foreground'}`}
              >
                {formatLeaderValue(leader.value, kpi.format, kpi.currency)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
