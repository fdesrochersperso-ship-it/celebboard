'use client'

import { useEffect, useState, useRef } from 'react'

type Props = {
  value: number
  startFrom?: number
  duration?: number
  className?: string
  formatAsCurrency?: boolean
  currency?: string
  locale?: string
  abbreviate?: boolean
}

function easeInQuad(t: number): number {
  return t * t
}

export function AnimatedCounter({
  value,
  startFrom,
  duration = 1500,
  className = '',
  formatAsCurrency = true,
  currency = 'CAD',
  locale = 'en-CA',
  abbreviate = false,
}: Props) {
  const initialValue = startFrom ?? 0
  const [displayValue, setDisplayValue] = useState(initialValue)
  const [isAnimating, setIsAnimating] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (value === initialValue && !isAnimating) return
    setDisplayValue(initialValue)
    setIsAnimating(true)
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - (startTimeRef.current ?? timestamp)
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeInQuad(progress)
      const currentValue = Math.floor(initialValue + (value - initialValue) * eased)
      setDisplayValue(currentValue)
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
        setIsAnimating(false)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [value, initialValue, duration])

  const formatNumber = (num: number) => {
    if (formatAsCurrency) {
      if (abbreviate) {
        const abs = Math.abs(num)
        if (abs >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
        if (abs >= 1_000) return `$${(num / 1_000).toFixed(0)}K`
      }
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num)
    }
    if (abbreviate) {
      const abs = Math.abs(num)
      if (abs >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
      if (abs >= 1_000) return `${(num / 1_000).toFixed(0)}K`
    }
    return num.toLocaleString(locale)
  }

  return (
    <span
      className={`tabular-nums transition-transform duration-300 inline-block ${isAnimating ? 'scale-105' : 'scale-100'} ${className}`}
      style={
        isAnimating
          ? { textShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }
          : undefined
      }
    >
      {formatNumber(displayValue)}
    </span>
  )
}
