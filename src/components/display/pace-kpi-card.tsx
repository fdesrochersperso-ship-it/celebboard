'use client'

import { useEffect, useState, useRef } from 'react'
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react'
import { AnimatedCounter } from './animated-counter'

const GRADIENT_VARIANTS = ['gradient-primary', 'gradient-success', 'gradient-celebration', 'gradient-primary'] as const
const RANK_EMOJIS = ['🥇', '🥈', '🥉'] as const
const RANK_COLORS = ['text-yellow-500', 'text-slate-400', 'text-amber-700'] as const

function getIconForLabel(label: string): LucideIcon {
  const lower = label.toLowerCase()
  if (lower.includes('revenue') || lower.includes('sales') || lower.includes('amount')) return DollarSign
  if (lower.includes('user') || lower.includes('customer') || lower.includes('subscriber')) return Users
  if (lower.includes('target') || lower.includes('goal')) return Target
  if (lower.includes('application') || lower.includes('package') || lower.includes('opportunity') || lower.includes('mql')) return ClipboardList
  return TrendingUp
}

function getPaceBadge(count: number, goal: number): { label: string; className: string } {
  const now = new Date()
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  const endOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0)
  const totalDays = Math.ceil((endOfQuarter.getTime() - startOfQuarter.getTime()) / (1000 * 60 * 60 * 24))
  const daysElapsed = Math.ceil((now.getTime() - startOfQuarter.getTime()) / (1000 * 60 * 60 * 24))
  const expectedPace = totalDays > 0 ? (daysElapsed / totalDays) * goal : 0
  const diff = count - expectedPace

  if (diff >= 0) {
    return {
      label: `↑ ${Math.round(diff).toLocaleString()}`,
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    }
  }
  return {
    label: `↓ ${Math.round(Math.abs(diff)).toLocaleString()}`,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
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
  goal?: number | null
  leaders?: Leader[]
  refresh_seconds?: number | null
}

type Props = {
  kpi: Kpi
  variantIndex?: number
}

export function PaceKpiCard({ kpi, variantIndex = 0 }: Props) {
  const [pulse, setPulse] = useState(false)
  const prevValue = useRef<number | null>(kpi.value ?? null)

  const Icon = getIconForLabel(kpi.label)
  const gradientClass = GRADIENT_VARIANTS[variantIndex % GRADIENT_VARIANTS.length] ?? 'gradient-primary'
  const leaders = (kpi.leaders ?? []).slice(0, 3)
  const count = kpi.value ?? 0
  const goal = kpi.goal ?? 100
  const progress = goal > 0 ? Math.min((count / goal) * 100, 100) : 0
  const paceBadge = getPaceBadge(count, goal)

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
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex size-14 items-center justify-center rounded-xl ${gradientClass} text-primary-foreground`}
        >
          <Icon className="size-7" />
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-lg font-bold ${paceBadge.className}`}
        >
          {paceBadge.label}
        </span>
      </div>
      <p className="mb-1 text-xl font-semibold text-foreground/80">{kpi.label}</p>
      <p className="mb-3 text-4xl font-bold tabular-nums text-foreground">
        {kpi.value != null ? (
          <>
            <AnimatedCounter
              value={kpi.value}
              startFrom={prevValue.current ?? 0}
              duration={800}
              formatAsCurrency={false}
              locale="en-CA"
              abbreviate={false}
              className={pulse ? 'scale-105' : ''}
            />
            {' / '}
            {goal.toLocaleString()}
          </>
        ) : (
          `— / ${goal.toLocaleString()}`
        )}
      </p>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

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
                {leader.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
